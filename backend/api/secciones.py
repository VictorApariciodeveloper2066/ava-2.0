"""
API Endpoints de Secciones y Cursos - AVA 2.0
Proporciona endpoints REST JSON para secciones (mobile app)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import User, Course, Seccion, Inscripcion, Asistencia
from backend.extensions import db
from datetime import datetime, timedelta
import secrets

secciones_api_bp = Blueprint('secciones_api', __name__)


@secciones_api_bp.route('', methods=['GET'])
@jwt_required()
def get_secciones():
    """
    GET /api/secciones
    Returns list of sections the user is enrolled in (for students) or teaches (for professors)
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    secciones = []
    
    if user.role == 'estudiante':
        # Get sections from Inscripcion
        inscripciones = Inscripcion.query.filter_by(
            estudiante_id=user_id,
            estado='activa'
        ).all()
        
        for inscripcion in inscripciones:
            seccion = Seccion.query.get(inscripcion.seccion_id)
            if seccion and seccion.activo:
                secciones.append({
                    "id": seccion.id,
                    "codigo": seccion.codigo,
                    "aula": seccion.aula,
                    "dia": seccion.dia,
                    "start_time": seccion.start_time.strftime("%H:%M") if seccion.start_time else None,
                    "end_time": seccion.end_time.strftime("%H:%M") if seccion.end_time else None,
                    "capacidad": seccion.capacidad,
                    "asignatura_id": seccion.asignatura_id,
                    "periodo_id": seccion.periodo_id
                })
    
    elif user.role == 'profesor':
        # Get sections where user is professor
        secciones_del_profesor = Seccion.query.filter_by(
            profesor_id=user_id,
            activo=True
        ).all()
        
        for seccion in secciones_del_profesor:
            secciones.append({
                "id": seccion.id,
                "codigo": seccion.codigo,
                "aula": seccion.aula,
                "dia": seccion.dia,
                "start_time": seccion.start_time.strftime("%H:%M") if seccion.start_time else None,
                "end_time": seccion.end_time.strftime("%H:%M") if seccion.end_time else None,
                "capacidad": seccion.capacidad,
                "asignatura_id": seccion.asignatura_id,
                "periodo_id": seccion.periodo_id
            })
    
    return jsonify({"secciones": secciones}), 200


@secciones_api_bp.route('/<int:seccion_id>', methods=['GET'])
@jwt_required()
def get_seccion_detail(seccion_id):
    """
    GET /api/secciones/<seccion_id>
    Returns details of a specific section
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    seccion = Seccion.query.get(seccion_id)
    if not seccion:
        return jsonify({"error": "Sección no encontrada"}), 404
    
    # Check access
    if user.role == 'estudiante':
        # Verify enrollment
        inscripcion = Inscripcion.query.filter_by(
            estudiante_id=user_id,
            seccion_id=seccion_id,
            estado='activa'
        ).first()
        if not inscripcion:
            return jsonify({"error": "No tienes acceso a esta sección"}), 403
    
    elif user.role == 'profesor':
        if seccion.profesor_id != user_id:
            return jsonify({"error": "No tienes acceso a esta sección"}), 403
    
    return jsonify({
        "seccion": {
            "id": seccion.id,
            "codigo": seccion.codigo,
            "aula": seccion.aula,
            "dia": seccion.dia,
            "start_time": seccion.start_time.strftime("%H:%M") if seccion.start_time else None,
            "end_time": seccion.end_time.strftime("%H:%M") if seccion.end_time else None,
            "capacidad": seccion.capacidad,
            "asignatura_id": seccion.asignatura_id,
            "periodo_id": seccion.periodo_id,
            "profesor_id": seccion.profesor_id
        }
    }), 200


@secciones_api_bp.route('/<int:seccion_id>/asistencia', methods=['POST'])
@jwt_required()
def marcar_asistencia(seccion_id):
    """
    POST /api/secciones/<seccion_id>/asistencia
    Body: {"codigo_sesion": "..."}
    Mark attendance using session code
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    data = request.get_json()
    codigo_sesion = data.get('codigo_sesion')
    
    if not codigo_sesion:
        return jsonify({"error": "Código de sesión requerido"}), 400
    
    seccion = Seccion.query.get(seccion_id)
    if not seccion:
        return jsonify({"error": "Sección no encontrada"}), 404
    
    # Verify enrollment
    if user.role == 'estudiante':
        inscripcion = Inscripcion.query.filter_by(
            estudiante_id=user_id,
            seccion_id=seccion_id,
            estado='activa'
        ).first()
        if not inscripcion:
            return jsonify({"error": "No estás inscrito en esta sección"}), 403
    
    # Verify session code matches
    if seccion.session_code != codigo_sesion:
        return jsonify({"error": "Código de sesión incorrecto"}), 400
    
    # Check if code hasn't expired
    if seccion.session_expires and seccion.session_expires < datetime.utcnow():
        return jsonify({"error": "El código de sesión ha expirado"}), 400
    
    # Check if already marked attendance today
    today = datetime.utcnow().date()
    asistencia_existente = Asistencia.query.filter(
        Asistencia.user_id == user_id,
        Asistencia.course_id == seccion_id,  # Note: this uses legacy Course, need to map
        db.func.date(Asistencia.date) == today
    ).first()
    
    if asistencia_existente:
        return jsonify({"error": "Ya has marcado asistencia hoy"}), 400
    
    # Create attendance record
    now = datetime.utcnow()
    asistencia = Asistencia(
        user_id=user_id,
        course_id=seccion_id,  # Legacy field - maps to Seccion
        date=now.date(),
        time=now.time(),
        state='presente'
    )
    db.session.add(asistencia)
    db.session.commit()
    
    return jsonify({
        "message": "Asistencia marcada exitosamente",
        "asistencia": {
            "id": asistencia.id,
            "date": asistencia.date.isoformat(),
            "time": asistencia.time.strftime("%H:%M"),
            "state": asistencia.state
        }
    }), 201


@secciones_api_bp.route('/<int:seccion_id>/generar-codigo', methods=['POST'])
@jwt_required()
def generar_codigo_sesion(seccion_id):
    """
    POST /api/secciones/<seccion_id>/generar-codigo
    Generate a session code for students to mark attendance
    Only for professors
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.role != 'profesor':
        return jsonify({"error": "Solo profesores pueden generar códigos"}), 403
    
    seccion = Seccion.query.get(seccion_id)
    if not seccion:
        return jsonify({"error": "Sección no encontrada"}), 404
    
    # Verify professor teaches this section
    if seccion.profesor_id != user_id:
        return jsonify({"error": "No eres el profesor de esta sección"}), 403
    
    # Generate 4-digit code
    codigo = secrets.randbelow(9000) + 1000  # 1000-9999
    
    # Set expiration (default 10 minutes)
    expires_minutes = request.json.get('expires_minutes', 10) if request.json else 10
    expires = datetime.utcnow() + timedelta(minutes=expires_minutes)
    
    seccion.session_code = str(codigo)
    seccion.session_expires = expires
    db.session.commit()
    
    return jsonify({
        "codigo": str(codigo),
        "expires": expires.isoformat(),
        "expires_minutes": expires_minutes
    }), 200


@secciones_api_bp.route('/<int:seccion_id>/historial', methods=['GET'])
@jwt_required()
def get_seccion_historial(seccion_id):
    """
    GET /api/secciones/<seccion_id>/historial
    Get attendance history for a section
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    seccion = Seccion.query.get(seccion_id)
    if not seccion:
        return jsonify({"error": "Sección no encontrada"}), 404
    
    # Check access
    is_professor = user.role == 'profesor' and seccion.profesor_id == user_id
    
    if user.role == 'estudiante':
        # Check enrollment
        inscripcion = Inscripcion.query.filter_by(
            estudiante_id=user_id,
            seccion_id=seccion_id,
            estado='activa'
        ).first()
        if not inscripcion:
            return jsonify({"error": "No tienes acceso a esta sección"}), 403
    
    # Get attendance records
    # For students: only their own records
    # For professors: all records
    if user.role == 'estudiante':
        ausencias = Asistencia.query.filter(
            Asistencia.user_id == user_id,
            Asistencia.course_id == seccion_id
        ).order_by(Asistencia.date.desc()).limit(30).all()
    else:
        ausencias = Asistencia.query.filter(
            Asistencia.course_id == seccion_id
        ).order_by(Asistencia.date.desc()).limit(30).all()
    
    historial = []
    for a in ausencias:
        historial.append({
            "id": a.id,
            "date": a.date.isoformat() if a.date else None,
            "time": a.time.strftime("%H:%M") if a.time else None,
            "state": a.state,
            "user_id": a.user_id
        })
    
    return jsonify({"historial": historial}), 200