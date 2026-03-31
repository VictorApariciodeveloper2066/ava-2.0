"""
API Endpoints de Inscripción - AVA 2.0
Endpoints para carreras, períodos, asignaturas, secciones e inscripciones
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import (
    User, Carrera, Asignatura, PeriodoAcademico, 
    Seccion, Inscripcion
)
from backend.extensions import db
from datetime import datetime, time
from sqlalchemy import and_

inscripcion_api_bp = Blueprint('inscripcion_api', __name__)


@inscripcion_api_bp.route('/carreras', methods=['GET'])
@jwt_required()
def get_carreras():
    """
    GET /api/inscripcion/carreras
    Returns list of active careers
    """
    carreras = Carrera.query.filter_by(activo=True).all()
    
    return jsonify({
        "carreras": [
            {
                "id": c.id,
                "nombre": c.nombre,
                "codigo": c.codigo,
                "duracion_semestres": c.duracion_semestres
            }
            for c in carreras
        ]
    }), 200


@inscripcion_api_bp.route('/periodos/actual', methods=['GET'])
@jwt_required()
def get_periodo_actual():
    """
    GET /api/inscripcion/periodos/actual
    Returns current active academic period
    """
    # Find the period marked as current or the most recent active one
    periodo = PeriodoAcademico.query.filter_by(
        es_actual=True, 
        activo=True
    ).first()
    
    if not periodo:
        # Fallback: get the most recent active period
        periodo = PeriodoAcademico.query.filter_by(activo=True)\
            .order_by(PeriodoAcademico.fecha_inicio.desc())\
            .first()
    
    if not periodo:
        return jsonify({"error": "No hay período académico activo"}), 404
    
    return jsonify({
        "periodo": {
            "id": periodo.id,
            "nombre": periodo.nombre,
            "fecha_inicio": periodo.fecha_inicio.isoformat() if periodo.fecha_inicio else None,
            "fecha_fin": periodo.fecha_fin.isoformat() if periodo.fecha_fin else None
        }
    }), 200


@inscripcion_api_bp.route('/asignaturas', methods=['GET'])
@jwt_required()
def get_asignaturas():
    """
    GET /api/inscripcion/asignaturas?carrera_id=X&semestre=Y
    Returns subjects for a career and semester
    """
    carrera_id = request.args.get('carrera_id', type=int)
    semestre = request.args.get('semestre', type=int)
    
    if not carrera_id:
        return jsonify({"error": "carrera_id es requerido"}), 400
    
    query = Asignatura.query.filter_by(
        carrera_id=carrera_id,
        activo=True
    )
    
    if semestre:
        query = query.filter_by(semestre=semestre)
    
    asignaturas = query.order_by(Asignatura.semestre, Asignatura.nombre).all()
    
    return jsonify({
        "asignaturas": [
            {
                "id": a.id,
                "codigo": a.codigo,
                "nombre": a.nombre,
                "semestre": a.semestre,
                "uv": a.uv
            }
            for a in asignaturas
        ]
    }), 200


@inscripcion_api_bp.route('/secciones/disponibles', methods=['GET'])
@jwt_required()
def get_secciones_disponibles():
    """
    GET /api/inscripcion/secciones/disponibles?asignatura_id=X&periodo_id=Y
    Returns available sections (with capacity) for a subject in a period
    """
    asignatura_id = request.args.get('asignatura_id', type=int)
    periodo_id = request.args.get('periodo_id', type=int)
    
    if not asignatura_id:
        return jsonify({"error": "asignatura_id es requerido"}), 400
    
    # Get current period if not specified
    if not periodo_id:
        periodo = PeriodoAcademico.query.filter_by(es_actual=True, activo=True).first()
        if not periodo:
            periodo = PeriodoAcademico.query.filter_by(activo=True)\
                .order_by(PeriodoAcademico.fecha_inicio.desc()).first()
        if not periodo:
            return jsonify({"error": "No hay período académico activo"}), 404
        periodo_id = periodo.id
    
    # Get sections with capacity info
    secciones = Seccion.query.filter_by(
        asignatura_id=asignatura_id,
        periodo_id=periodo_id,
        activo=True
    ).all()
    
    result = []
    for seccion in secciones:
        # Count current enrollments
        inscritos = Inscripcion.query.filter_by(
            seccion_id=seccion.id,
            estado='activa'
        ).count()
        
        # Only include if there's capacity
        if inscritos < seccion.capacidad:
            # Get professor info
            profesor = User.query.get(seccion.profesor_id) if seccion.profesor_id else None
            
            result.append({
                "id": seccion.id,
                "codigo": seccion.codigo,
                "aula": seccion.aula,
                "dia": seccion.dia,
                "start_time": seccion.start_time.strftime("%H:%M") if seccion.start_time else None,
                "end_time": seccion.end_time.strftime("%H:%M") if seccion.end_time else None,
                "capacidad": seccion.capacidad,
                "inscritos": inscritos,
                "disponibles": seccion.capacidad - inscritos,
                "profesor": {
                    "id": profesor.id,
                    "nombre": f"{profesor.primer_nombre or ''} {profesor.primer_apellido or ''}".strip() if profesor else "Sin asignar"
                } if profesor else None
            })
    
    return jsonify({
        "secciones": result
    }), 200


@inscripcion_api_bp.route('/inscripcion', methods=['POST'])
@jwt_required()
def inscribirse():
    """
    POST /api/inscripcion/inscripcion
    Body: { "seccion_id": 123 }
    Enrolls user in a section
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('seccion_id'):
        return jsonify({"error": "seccion_id es requerido"}), 400
    
    seccion_id = data.get('seccion_id')
    
    # Validate section exists and has capacity
    seccion = Seccion.query.get(seccion_id)
    if not seccion or not seccion.activo:
        return jsonify({"error": "Sección no encontrada o inactiva"}), 404
    
    # Check capacity
    inscritos = Inscripcion.query.filter_by(
        seccion_id=seccion_id,
        estado='activa'
    ).count()
    
    if inscritos >= seccion.capacidad:
        return jsonify({"error": "La sección está llena"}), 400
    
    # Check if already enrolled in this subject (via same seccion or another seccion of same asignatura)
    existing = Inscripcion.query.join(Seccion).filter(
        Inscripcion.estudiante_id == user_id,
        Seccion.asignatura_id == seccion.asignatura_id,
        Seccion.periodo_id == seccion.periodo_id,
        Inscripcion.estado == 'activa'
    ).first()
    
    if existing:
        return jsonify({"error": "Ya estás inscrito en esta materia"}), 400
    
    # Check for schedule conflicts
    user_inscriptions = Inscripcion.query.filter_by(
        estudiante_id=user_id,
        estado='activa'
    ).all()
    
    for insc in user_inscriptions:
        existing_seccion = Seccion.query.get(insc.seccion_id)
        if existing_seccion and existing_seccion.dia == seccion.dia:
            # Check time overlap
            if (seccion.start_time < existing_seccion.end_time and 
                seccion.end_time > existing_seccion.start_time):
                return jsonify({
                    "error": f"Conflicto de horario con otra materia el día {get_day_name(seccion.dia)}"
                }), 400
    
    # Create enrollment
    inscripcion = Inscripcion(
        estudiante_id=user_id,
        seccion_id=seccion_id,
        estado='activa'
    )
    db.session.add(inscripcion)
    db.session.commit()
    
    return jsonify({
        "message": "Inscripción exitosa",
        "inscripcion_id": inscripcion.id
    }), 201


@inscripcion_api_bp.route('/inscripcion/lote', methods=['POST'])
@jwt_required()
def inscribirse_lote():
    """
    POST /api/inscripcion/inscripcion/lote
    Body: { "secciones": [1, 2, 3] }
    Enrolls user in multiple sections at once
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('secciones'):
        return jsonify({"error": "Se requiere array de secciones"}), 400
    
    secciones_ids = data.get('secciones')
    
    if len(secciones_ids) < 1:
        return jsonify({"error": "Debe inscribir al menos 1 materia"}), 400
    
    # Validate all sections
    secciones = []
    for sid in secciones_ids:
        seccion = Seccion.query.get(sid)
        if not seccion or not seccion.activo:
            return jsonify({"error": f"Sección {sid} no encontrada o inactiva"}), 404
        
        # Check capacity
        inscritos = Inscripcion.query.filter_by(
            seccion_id=sid,
            estado='activa'
        ).count()
        
        if inscritos >= seccion.capacidad:
            return jsonify({"error": f"Sección {seccion.codigo} está llena"}), 400
        
        # Check if already enrolled in this subject
        existing = Inscripcion.query.join(Seccion).filter(
            Inscripcion.estudiante_id == user_id,
            Seccion.asignatura_id == seccion.asignatura_id,
            Seccion.periodo_id == seccion.periodo_id,
            Inscripcion.estado == 'activa'
        ).first()
        
        if existing:
            return jsonify({"error": f"Ya estás inscrito en {seccion.codigo}"}), 400
        
        secciones.append(seccion)
    
    # Check for schedule conflicts among selected sections
    for i, seccion in enumerate(secciones):
        for j, other in enumerate(secciones):
            if i < j and seccion.dia == other.dia:
                if (seccion.start_time < other.end_time and 
                    seccion.end_time > other.start_time):
                    return jsonify({
                        "error": f"Conflicto de horario: {seccion.codigo} y {other.codigo} el día {get_day_name(seccion.dia)}"
                    }), 400
    
    # Create all enrollments
    inscripciones = []
    for seccion in secciones:
        inscripcion = Inscripcion(
            estudiante_id=user_id,
            seccion_id=seccion.id,
            estado='activa'
        )
        db.session.add(inscripcion)
        inscripciones.append(inscripcion)
    
    db.session.commit()
    
    return jsonify({
        "message": f"Inscripción exitosa: {len(inscripciones)} materias",
        "inscripciones": [i.id for i in inscripciones]
    }), 201


def get_day_name(dia):
    """Get day name from number"""
    days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    return days[dia] if 0 <= dia <= 7 else 'Desconocido'
