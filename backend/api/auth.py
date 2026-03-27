"""
API Endpoints de Autenticación - AVA 2.0
Proporciona endpoints REST JSON para autenticación JWT (mobile app)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from backend.models import User, Course, User_course
from backend.extensions import db
from sqlalchemy import or_
from werkzeug.security import generate_password_hash
import re

auth_api_bp = Blueprint('auth_api', __name__)

def validate_password(password):
    """Validate password meets requirements."""
    if len(password) < 6:
        return False, "La contraseña debe tener al menos 6 caracteres"
    return True, None

def validate_username(username):
    """Validate username format."""
    if len(username) < 3:
        return False, "El usuario debe tener al menos 3 caracteres"
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "El usuario solo puede contener letras, números y guiones bajos"
    return True, None


@auth_api_bp.route('/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    Body: {"username": "...", "password": "..."}
    Returns: {"access_token": "...", "refresh_token": "...", "user": {...}}
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Cuerpo de solicitud inválido"}), 400
    
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Usuario y contraseña requeridos"}), 400
    
    # Buscar por username o email
    user = User.query.filter(or_(
        User.username == username,
        User.email == username
    )).first()
    
    if not user or not user.check_password(password):
        return jsonify({"error": "Credenciales inválidas"}), 401
    
    if not user.activo:
        return jsonify({"error": "Cuenta desactivada"}), 403
    
    # Crear tokens JWT - identity debe ser string
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "primer_nombre": user.primer_nombre,
            "primer_apellido": user.primer_apellido,
            "ci": user.ci,
            "telefono": user.telefono,
            "es_comandante": user.es_comandante,
            "carrera_id": user.carrera_id,
            "institucion_id": user.institucion_id
        }
    }), 200


@auth_api_bp.route('/register', methods=['POST'])
def register():
    """
    POST /api/auth/register
    Body: {"username": "...", "email": "...", "password": "...", "primer_nombre": "...", "primer_apellido": "...", "ci": "..."}
    Returns: {"access_token": "...", "user": {...}}
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Cuerpo de solicitud inválido"}), 400
    
    # Validar campos requeridos
    required_fields = ['username', 'email', 'password', 'primer_nombre', 'primer_apellido']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Campo '{field}' requerido"}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    primer_nombre = data.get('primer_nombre')
    primer_apellido = data.get('primer_apellido')
    ci = data.get('ci', '')
    telefono = data.get('telefono', '')
    role = data.get('role', 'estudiante')  # Default role
    
    # Validar username
    valid, error = validate_username(username)
    if not valid:
        return jsonify({"error": error}), 400
    
    # Validar password
    valid, error = validate_password(password)
    if not valid:
        return jsonify({"error": error}), 400
    
    # Verificar usuario existente
    if User.query.filter(User.username == username).first():
        return jsonify({"error": "El usuario ya existe"}), 409
    
    if User.query.filter(User.email == email).first():
        return jsonify({"error": "El correo ya está registrado"}), 409
    
    # Crear usuario
    user = User(
        username=username,
        email=email,
        primer_nombre=primer_nombre,
        primer_apellido=primer_apellido,
        ci=ci,
        telefono=telefono,
        role=role
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    # Crear tokens JWT - identity debe ser string
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "primer_nombre": user.primer_nombre,
            "primer_apellido": user.primer_apellido,
            "ci": user.ci,
            "telefono": user.telefono
        }
    }), 201


@auth_api_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """POST /api/auth/refresh - Refresh access token"""
    identity = get_jwt_identity()
    access_token = create_access_token(identity=str(identity))
    return jsonify({"access_token": access_token}), 200


@auth_api_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    GET /api/auth/profile
    Headers: Authorization: Bearer <access_token>
    Returns: {"user": {...}}
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    return jsonify({
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "primer_nombre": user.primer_nombre,
            "primer_apellido": user.primer_apellido,
            "ci": user.ci,
            "telefono": user.telefono,
            "avatar_url": user.avatar_url,
            "es_comandante": user.es_comandante,
            "carrera_id": user.carrera_id,
            "institucion_id": user.institucion_id,
            "notificaciones_activas": user.notificaciones_activas,
            "formato_hora": user.formato_hora,
            "activo": user.activo
        }
    }), 200


@auth_api_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    PUT /api/auth/profile
    Body: {"primer_nombre": "...", "primer_apellido": "...", "telefono": "...", "ci": "..."}
    Returns: {"user": {...}}
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    data = request.get_json()
    
    # Campos actualizables
    updatable_fields = ['primer_nombre', 'primer_apellido', 'ci', 'telefono']
    
    for field in updatable_fields:
        if field in data:
            setattr(user, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "primer_nombre": user.primer_nombre,
            "primer_apellido": user.primer_apellido,
            "ci": user.ci,
            "telefono": user.telefono
        },
        "message": "Perfil actualizado exitosamente"
    }), 200


@auth_api_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    POST /api/auth/change-password
    Body: {"current_password": "...", "new_password": "..."}
    Returns: {"message": "..."}
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({"error": "Contraseñas requeridas"}), 400
    
    if not user.check_password(current_password):
        return jsonify({"error": "Contraseña actual incorrecta"}), 401
    
    # Validar nueva contraseña
    valid, error = validate_password(new_password)
    if not valid:
        return jsonify({"error": error}), 400
    
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({"message": "Contraseña actualizada exitosamente"}), 200


@auth_api_bp.route('/me/cursos', methods=['GET'])
@jwt_required()
def get_my_courses():
    """
    GET /api/auth/me/cursos
    Returns list of courses the user is enrolled in
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    # Obtener cursos del usuario (relación many-to-many con Course)
    courses = user.courses.all()
    
    courses_data = []
    for course in courses:
        courses_data.append({
            "id": course.id,
            "name": course.name,
            "aula": course.aula,
            "dia": course.dia,
            "start_time": course.start_time.strftime("%H:%M") if course.start_time else None,
            "end_time": course.end_time.strftime("%H:%M") if course.end_time else None
        })
    
    return jsonify({"cursos": courses_data}), 200