"""
API Endpoints de Justificativos - AVA 2.0
Proporciona endpoints REST JSON para justificativos (mobile app)
"""
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import User, Justificativo, Course
from backend.extensions import db
from werkzeug.utils import secure_filename
import os
from datetime import datetime

justificativos_api_bp = Blueprint('justificativos_api', __name__)

# Configuration for file uploads
UPLOAD_FOLDER = 'uploads/justificativos'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@justificativos_api_bp.route('', methods=['GET'])
@jwt_required()
def get_justificativos():
    """
    GET /api/justificativos
    Query params: course_id (optional), estado (optional)
    Returns list of justificativos for the user
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    course_id = request.args.get('course_id', type=int)
    estado = request.args.get('estado')
    
    query = Justificativo.query.filter(Justificativo.user_id == user_id)
    
    if course_id:
        query = query.filter(Justificativo.course_id == course_id)
    
    if estado:
        query = query.filter(Justificativo.estado == estado)
    
    justificativos = query.order_by(Justificativo.id.desc()).all()
    
    results = []
    for j in justificativos:
        course = Course.query.get(j.course_id)
        results.append({
            "id": j.id,
            "course_id": j.course_id,
            "course_name": course.name if course else "Unknown",
            "fecha_clase": j.fecha_clase,
            "motivo": j.motivo,
            "archivo_nombre": j.archivo_nombre,
            "estado": j.estado,
            "created_at": j.id  # Justificativo doesn't have created_at, using id as proxy
        })
    
    return jsonify({"justificativos": results}), 200


@justificativos_api_bp.route('', methods=['POST'])
@jwt_required()
def create_justificativo():
    """
    POST /api/justificativos
    Body (form-data): course_id, fecha_clase, motivo, archivo (optional)
    Creates a new justificativo request
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    course_id = request.form.get('course_id', type=int)
    fecha_clase = request.form.get('fecha_clase')
    motivo = request.form.get('motivo')
    
    if not course_id or not fecha_clase or not motivo:
        return jsonify({"error": "Campos requeridos: course_id, fecha_clase, motivo"}), 400
    
    # Verify user is enrolled in course
    from backend.models import User_course
    enrollment = User_course.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not enrollment:
        return jsonify({"error": "No estás inscrito en este curso"}), 403
    
    # Handle file upload
    archivo_nombre = None
    if 'archivo' in request.files:
        file = request.files['archivo']
        if file and allowed_file(file.filename):
            # Create upload directory if not exists
            upload_path = os.path.join('instance', UPLOAD_FOLDER)
            os.makedirs(upload_path, exist_ok=True)
            
            # Save file
            filename = secure_filename(f"{user_id}_{datetime.utcnow().timestamp()}_{file.filename}")
            filepath = os.path.join(upload_path, filename)
            file.save(filepath)
            archivo_nombre = filename
    
    # Create justificativo
    justificativo = Justificativo(
        user_id=user_id,
        course_id=course_id,
        fecha_clase=fecha_clase,
        motivo=motivo,
        archivo_nombre=archivo_nombre,
        estado='Pendiente'
    )
    
    db.session.add(justificativo)
    db.session.commit()
    
    return jsonify({
        "message": "Justificativo enviado exitosamente",
        "justificativo": {
            "id": justificativo.id,
            "course_id": justificativo.course_id,
            "fecha_clase": justificativo.fecha_clase,
            "motivo": justificativo.motivo,
            "estado": justificativo.estado
        }
    }), 201


@justificativos_api_bp.route('/<int:justificativo_id>', methods=['GET'])
@jwt_required()
def get_justificativo(justificativo_id):
    """
    GET /api/justificativos/<id>
    Returns details of a specific justificativo
    """
    user_id = int(get_jwt_identity())
    
    justificativo = Justificativo.query.get(justificativo_id)
    if not justificativo:
        return jsonify({"error": "Justificativo no encontrado"}), 404
    
    # Only owner or admin can view
    if justificativo.user_id != user_id and user.role != 'admin':
        return jsonify({"error": "No tienes acceso a este justificativo"}), 403
    
    course = Course.query.get(justificativo.course_id)
    
    return jsonify({
        "justificativo": {
            "id": justificativo.id,
            "course_id": justificativo.course_id,
            "course_name": course.name if course else "Unknown",
            "fecha_clase": justificativo.fecha_clase,
            "motivo": justificativo.motivo,
            "archivo_nombre": justificativo.archivo_nombre,
            "estado": justificativo.estado
        }
    }), 200


@justificativos_api_bp.route('/<int:justificativo_id>', methods=['DELETE'])
@jwt_required()
def delete_justificativo(justificativo_id):
    """
    DELETE /api/justificativos/<id>
    Deletes a justificativo (only if pending)
    """
    user_id = int(get_jwt_identity())
    
    justificativo = Justificativo.query.get(justificativo_id)
    if not justificativo:
        return jsonify({"error": "Justificativo no encontrado"}), 404
    
    # Only owner can delete
    if justificativo.user_id != user_id:
        return jsonify({"error": "No tienes acceso a este justificativo"}), 403
    
    # Can only delete if pending
    if justificativo.estado != 'Pendiente':
        return jsonify({"error": "Solo justificativos pendientes pueden ser eliminados"}), 400
    
    # Delete file if exists
    if justificativo.archivo_nombre:
        filepath = os.path.join('instance', UPLOAD_FOLDER, justificativo.archivo_nombre)
        if os.path.exists(filepath):
            os.remove(filepath)
    
    db.session.delete(justificativo)
    db.session.commit()
    
    return jsonify({"message": "Justificativo eliminado exitosamente"}), 200


@justificativos_api_bp.route('/<int:justificativo_id>/archivo', methods=['GET'])
@jwt_required()
def download_archivo(justificativo_id):
    """
    GET /api/justificativos/<id>/archivo
    Downloads the attached file
    """
    user_id = int(get_jwt_identity())
    
    justificativo = Justificativo.query.get(justificativo_id)
    if not justificativo:
        return jsonify({"error": "Justificativo no encontrado"}), 404
    
    # Only owner can download
    if justificativo.user_id != user_id:
        return jsonify({"error": "No tienes acceso a este archivo"}), 403
    
    if not justificativo.archivo_nombre:
        return jsonify({"error": "No hay archivo adjuntado"}), 404
    
    upload_path = os.path.join('instance', UPLOAD_FOLDER)
    return send_from_directory(upload_path, justificativo.archivo_nombre)