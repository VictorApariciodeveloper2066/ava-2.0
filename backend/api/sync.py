"""
API Endpoints de Sincronización Offline - AVA 2.0
Proporciona endpoints para sincronizar datos cuando hay conexión
Usado principalmente por admins y profesores
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import User, Asistencia, Justificativo, Course, Seccion, Inscripcion
from backend.extensions import db
from datetime import datetime, timedelta

sync_api_bp = Blueprint('sync_api', __name__)


@sync_api_bp.route('', methods=['POST'])
@jwt_required()
def sync_data():
    """
    POST /api/sync
    Body: {
        "pending_attendance": [...],
        "pending_justificativos": [...],
        "last_sync": "ISO timestamp"
    }
    
    Receives pending data from mobile and processes it
    Returns: {"synced": {...}, "server_data": {...}}
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    data = request.get_json()
    
    # Only admins and professors can use full sync
    if user.role not in ['admin', 'comandante', 'profesor']:
        return jsonify({"error": "Solo administradores y profesores pueden sincronizar datos"}), 403
    
    synced_results = {
        "attendance": 0,
        "justificativos": 0
    }
    
    # Process pending attendance records
    pending_attendance = data.get('pending_attendance', [])
    for record in pending_attendance:
        try:
            # Check if already synced
            existing = Asistencia.query.filter(
                Asistencia.user_id == record.get('user_id'),
                Asistencia.course_id == record.get('course_id'),
                db.func.date(Asistencia.date) == record.get('date')
            ).first()
            
            if not existing:
                asistencia = Asistencia(
                    user_id=record.get('user_id'),
                    course_id=record.get('course_id'),
                    date=datetime.fromisoformat(record.get('date')).date() if record.get('date') else datetime.utcnow().date(),
                    time=datetime.fromisoformat(record.get('time')).time() if record.get('time') else datetime.utcnow().time(),
                    state=record.get('state', 'presente')
                )
                db.session.add(asistencia)
                synced_results["attendance"] += 1
        except Exception as e:
            continue  # Skip invalid records
    
    # Process pending justificativos
    pending_justificativos = data.get('pending_justificativos', [])
    for record in pending_justificativos:
        try:
            justificativo = Justificativo(
                user_id=record.get('user_id'),
                course_id=record.get('course_id'),
                fecha_clase=record.get('fecha_clase'),
                motivo=record.get('motivo'),
                archivo_nombre=record.get('archivo_nombre'),
                estado='Pendiente'
            )
            db.session.add(justificativo)
            synced_results["justificativos"] += 1
        except Exception as e:
            continue
    
    db.session.commit()
    
    # Get latest server data to send back
    server_data = get_server_data(user)
    
    return jsonify({
        "synced": synced_results,
        "server_data": server_data,
        "sync_timestamp": datetime.utcnow().isoformat()
    }), 200


@sync_api_bp.route('/push', methods=['POST'])
@jwt_required()
def push_attendance():
    """
    POST /api/sync/push
    Simplified endpoint to push attendance data from mobile
    Used for professors taking attendance on mobile
    
    Body: {
        "seccion_id": 1,
        "attendances": [
            {"user_id": 1, "state": "presente"},
            {"user_id": 2, "state": "ausente"}
        ]
    }
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role not in ['profesor', 'admin', 'comandante']:
        return jsonify({"error": "No autorizado"}), 403
    
    data = request.get_json()
    seccion_id = data.get('seccion_id')
    attendances = data.get('attendances', [])
    
    if not seccion_id:
        return jsonify({"error": "seccion_id requerido"}), 400
    
    # Verify user is professor of this section
    seccion = Seccion.query.get(seccion_id)
    if not seccion:
        return jsonify({"error": "Sección no encontrada"}), 404
    
    if user.role == 'profesor' and seccion.profesor_id != user_id:
        return jsonify({"error": "No eres el profesor de esta sección"}), 403
    
    synced_count = 0
    now = datetime.utcnow()
    
    for record in attendances:
        user_id_to_mark = record.get('user_id')
        state = record.get('state', 'presente')
        
        # Check if attendance already marked for this section today
        existing = Asistencia.query.filter(
            Asistencia.user_id == user_id_to_mark,
            Asistencia.course_id == seccion_id,  # Legacy: seccion maps to course
            db.func.date(Asistencia.date) == now.date()
        ).first()
        
        if not existing:
            asistencia = Asistencia(
                user_id=user_id_to_mark,
                course_id=seccion_id,
                date=now.date(),
                time=now.time(),
                state=state
            )
            db.session.add(asistencia)
            synced_count += 1
    
    db.session.commit()
    
    return jsonify({
        "message": f"Asistencia sincronizada: {synced_count} registros",
        "synced_count": synced_count
    }), 200


@sync_api_bp.route('/pull', methods=['GET'])
@jwt_required()
def pull_data():
    """
    GET /api/sync/pull
    Returns latest data for offline sync
    Used by mobile to get fresh data
    
    Query params: since (ISO timestamp optional)
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    server_data = get_server_data(user)
    
    return jsonify(server_data), 200


def get_server_data(user):
    """Helper to get relevant server data based on user role."""
    data = {
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if user.role == 'estudiante':
        # Student: their courses, attendance, justificativos
        courses = user.courses.all()
        data["cursos"] = [{
            "id": c.id,
            "name": c.name,
            "aula": c.aula,
            "dia": c.dia,
            "start_time": c.start_time.strftime("%H:%M") if c.start_time else None,
            "end_time": c.end_time.strftime("%H:%M") if c.end_time else None
        } for c in courses]
        
        data["asistencia_reciente"] = [
            {
                "course_id": a.course_id,
                "date": a.date.isoformat() if a.date else None,
                "state": a.state
            }
            for a in Asistencia.query.filter(Asistencia.user_id == user.id)
            .order_by(Asistencia.date.desc()).limit(30).all()
        ]
        
        data["justificativos"] = [
            {
                "id": j.id,
                "course_id": j.course_id,
                "fecha_clase": j.fecha_clase,
                "estado": j.estado
            }
            for j in Justificativo.query.filter(Justificativo.user_id == user.id).all()
        ]
    
    elif user.role in ['profesor', 'admin', 'comandante']:
        # Professor/Admin: their sections, students
        if user.role == 'profesor':
            secciones = Seccion.query.filter_by(profesor_id=user.id, activo=True).all()
        else:
            # Admin sees all active sections
            secciones = Seccion.query.filter_by(activo=True).limit(50).all()
        
        data["secciones"] = []
        for seccion in secciones:
            # Get enrolled students count
            estudiantes_count = Inscripcion.query.filter_by(
                seccion_id=seccion.id,
                estado='activa'
            ).count()
            
            data["secciones"].append({
                "id": seccion.id,
                "codigo": seccion.codigo,
                "aula": seccion.aula,
                "dia": seccion.dia,
                "start_time": seccion.start_time.strftime("%H:%M") if seccion.start_time else None,
                "end_time": seccion.end_time.strftime("%H:%M") if seccion.end_time else None,
                "estudiantes_count": estudiantes_count
            })
        
        # Recent attendance for their courses/secciones
        if user.role == 'profesor':
            course_ids = [s.id for s in Seccion.query.filter_by(profesor_id=user.id).all()]
        else:
            course_ids = [s.id for s in Seccion.query.filter_by(activo=True).limit(20).all()]
        
        data["asistencia_hoy"] = []
        today = datetime.utcnow().date()
        for a in Asistencia.query.filter(
            Asistencia.course_id.in_(course_ids),
            db.func.date(Asistencia.date) == today
        ).all():
            student = User.query.get(a.user_id)
            data["asistencia_hoy"].append({
                "course_id": a.course_id,
                "student_name": f"{student.primer_nombre} {student.primer_apellido}" if student else "Unknown",
                "date": a.date.isoformat() if a.date else None,
                "time": a.time.strftime("%H:%M") if a.time else None,
                "state": a.state
            })
    
    return data