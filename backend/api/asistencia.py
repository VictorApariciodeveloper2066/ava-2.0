"""
API Endpoints de Asistencia - AVA 2.0
Proporciona endpoints REST JSON para historial de asistencia (mobile app)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import User, Asistencia, Course
from backend.extensions import db
from sqlalchemy import func

asistencia_api_bp = Blueprint('asistencia_api', __name__)


@asistencia_api_bp.route('/historial', methods=['GET'])
@jwt_required()
def get_historial():
    """
    GET /api/asistencia/historial
    Query params: course_id (optional), limit (default 30)
    Returns attendance history for the user
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    course_id = request.args.get('course_id', type=int)
    limit = request.args.get('limit', default=30, type=int)
    
    query = Asistencia.query.filter(Asistencia.user_id == user_id)
    
    if course_id:
        query = query.filter(Asistencia.course_id == course_id)
    
    ausencias = query.order_by(Asistencia.date.desc()).limit(limit).all()
    
    historial = []
    for a in ausencias:
        course = Course.query.get(a.course_id)
        historial.append({
            "id": a.id,
            "course_id": a.course_id,
            "course_name": course.name if course else "Unknown",
            "date": a.date.isoformat() if a.date else None,
            "time": a.time.strftime("%H:%M") if a.time else None,
            "state": a.state
        })
    
    return jsonify({"historial": historial}), 200


@asistencia_api_bp.route('/resumen', methods=['GET'])
@jwt_required()
def get_resumen():
    """
    GET /api/asistencia/resumen
    Returns attendance summary for all courses
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    # Get all attendance records for user
    ausencias = Asistencia.query.filter(Asistencia.user_id == user_id).all()
    
    # Group by course
    resumen = {}
    for a in ausencias:
        if a.course_id not in resumen:
            course = Course.query.get(a.course_id)
            resumen[a.course_id] = {
                "course_id": a.course_id,
                "course_name": course.name if course else "Unknown",
                "total": 0,
                "presente": 0,
                "ausente": 0,
                "justificado": 0
            }
        
        resumen[a.course_id]["total"] += 1
        if a.state == 'presente':
            resumen[a.course_id]["presente"] += 1
        elif a.state == 'ausente':
            resumen[a.course_id]["ausente"] += 1
        elif a.state == 'justificado':
            resumen[a.course_id]["justificado"] += 1
    
    return jsonify({"resumen": list(resumen.values())}), 200


@asistencia_api_bp.route('/hoy', methods=['GET'])
@jwt_required()
def get_asistencia_hoy():
    """
    GET /api/asistencia/hoy
    Returns today's attendance status
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    from datetime import datetime
    today = datetime.utcnow().date()
    
    ausencias_hoy = Asistencia.query.filter(
        Asistencia.user_id == user_id,
        func.date(Asistencia.date) == today
    ).all()
    
    asistencia_hoy = []
    for a in ausencias_hoy:
        course = Course.query.get(a.course_id)
        asistencia_hoy.append({
            "id": a.id,
            "course_id": a.course_id,
            "course_name": course.name if course else "Unknown",
            "date": a.date.isoformat(),
            "time": a.time.strftime("%H:%M") if a.time else None,
            "state": a.state
        })
    
    return jsonify({"asistencia_hoy": asistencia_hoy}), 200