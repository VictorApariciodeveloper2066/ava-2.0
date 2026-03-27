from flask import Blueprint, request, session, jsonify, redirect, url_for
from backend.models import User, Course, Asistencia, User_course, Justificativo, HistorialAsistencia, DetalleAsistencia
from backend.extensions import db
from sqlalchemy import or_
from datetime import datetime
from itsdangerous import URLSafeTimedSerializer
from flask import current_app
import secrets, string
from flask_mail import Message
from backend.extensions import mail
import traceback
import os
from werkzeug.utils import secure_filename
from authlib.integrations.flask_client import OAuth

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
oauth = OAuth()

def init_oauth(app):
    oauth.init_app(app)
    oauth.register(
        name='google',
        client_id=app.config.get('GOOGLE_CLIENT_ID'),
        client_secret=app.config.get('GOOGLE_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Missing JSON body"}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    # Allow users to login with either username or email
    user = User.query.filter(or_(User.username == username, User.email == username)).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    session['username'] = user.username

    return jsonify({
        "message": "Login successful",
        "user": {
            "username": user.username,
            "role": user.role
        }
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')

        if not username or not email or not password:
            return jsonify({"error": "Usuario, email y contraseña son requeridos"}), 400
        
        # Validar longitud mínima de contraseña
        if len(password) < 8:
            return jsonify({"error": "La contraseña debe tener al menos 8 caracteres"}), 400
        
        # Validar formato de usuario (alfanumérico y guiones bajos)
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return jsonify({"error": "El usuario solo puede contener letras, números y guiones bajos"}), 400

        user_exists = User.query.filter_by(username=username).first()
        email_exists = User.query.filter_by(email=email).first()

        if user_exists:
            return jsonify({"error": "El usuario ya existe"}), 409

        if email_exists:
            return jsonify({"error": "El email ya está registrado"}), 409

        new_user = User(username=username, email=email)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "message": "Registration successful",
            "user": {
                "username": new_user.username,
                "email": new_user.email
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error en registro: {e}")
        traceback.print_exc()
        return jsonify({"error": "Error en el registro. Intenta nuevamente."}), 500

# Nueva ruta para marcar asistencia

from datetime import datetime
from flask import Blueprint, request, session, jsonify
from backend.models import User, Course, Asistencia, User_course
from backend.extensions import db

# ... dentro de tu blueprint ...

@auth_bp.route('/marcar_asistencia', methods=['POST'])
def marcar_asistencia():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401

    data = request.get_json()
    course_id = data.get('course_id')
    user = User.query.filter_by(username=session['username']).first()
    course = Course.query.get(course_id)

    if not course:
        return jsonify({"error": "Curso no encontrado"}), 404

    # 1. Validar que el alumno está inscrito en este curso
    inscrito = db.session.query(User_course).filter_by(user_id=user.id, course_id=course_id).first()
    if not inscrito:
        return jsonify({"error": "No estás inscrito en este curso"}), 403

    # 2. Validar Horario
    now = datetime.now()
    current_time = now.time()
    current_day = now.weekday() + 1  # 1=Lunes, etc.

    if current_day != course.dia:
        return jsonify({"error": "Hoy no es el día de esta clase"}), 400

    if not (course.start_time <= current_time <= course.end_time):
        return jsonify({"error": "Fuera del horario de clase"}), 400

    # 3. Evitar duplicados el mismo día
    exists = Asistencia.query.filter_by(user_id=user.id, course_id=course_id, date=now.date()).first()
    if exists:
        return jsonify({"error": "Ya marcaste asistencia hoy"}), 409

    # 4. Registrar Asistencia
    nueva_asistencia = Asistencia(
        user_id=user.id,
        course_id=course.id,
        date=now.date(),
        time=current_time,
        state="Presente"
    )
    
    db.session.add(nueva_asistencia)
    db.session.commit()

    return jsonify({"message": "Asistencia registrada con éxito"}), 201


@auth_bp.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('front.index'))


@auth_bp.route('/generate_code/<int:course_id>', methods=['POST'])
def generate_code(course_id):
    # local imports to avoid modifying top-level import list
    from datetime import datetime, date, timedelta
    import secrets, string

    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user or (user.role != 'teacher' and not (user.role == 'student' and user.es_comandante)):
        return jsonify({"error": "Solo profesores y comandantes pueden generar códigos"}), 403

    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Curso no encontrado"}), 404

    # generate 5-char alphanumeric code
    alphabet = string.ascii_uppercase + string.digits
    new_code = ''.join(secrets.choice(alphabet) for _ in range(5))

    # set expiry at today's course end_time if available, otherwise 1 hour from now
    now = datetime.now()
    expires = None
    try:
        if course.end_time:
            expires = datetime.combine(date.today(), course.end_time)
            if expires < now:
                expires = now + timedelta(hours=1)
    except Exception:
        expires = now + timedelta(hours=1)

    course.session_code = new_code
    course.session_expires = expires
    db.session.commit()
    
    # Registrar log
    from backend.models import LogAsistencia
    log = LogAsistencia(
        course_id=course_id,
        user_id=None,
        modificado_por=user.id,
        accion=f'Generó código de sesión: {new_code}',
        estado_anterior=None,
        estado_nuevo=None,
        fecha=now.date(),
        hora=now.time()
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"code": new_code, "expires": expires.isoformat() if expires else None}), 200


def generar_token(email):
    serializer = URLSafeTimedSerializer(current_app.config.get('SECRET_KEY', 'supersecretkey'))
    return serializer.dumps(email, salt='recuperar-password-salt')


@auth_bp.route('/recuperar_password', methods=['POST'])
def recuperar_password():
    try:
        data = request.get_json() or {}
        email = data.get('email')

        if not email:
            return jsonify({"error": "El correo es requerido"}), 400

        user = User.query.filter_by(email=email).first()
        if user:
            token = generar_token(email)
            recover_url = url_for('front.restablecer_page', token=token, _external=True)
            # Always print the recovery URL to console for development/testing
            print(f"RECOVERY LINK: {recover_url}")
            current_app.logger.info(f"RECOVERY LINK: {recover_url}")

            msg = Message("Restablecer Contraseña - AVA",
                          sender=current_app.config.get('MAIL_DEFAULT_SENDER', current_app.config.get('MAIL_USERNAME')),
                          recipients=[email])
            msg.body = f"Hola {user.username},\n\nPara restablecer tu contraseña, haz clic en el siguiente enlace:\n{recover_url}\n\nEste enlace expirará en 30 minutos.\nSi no solicitaste este cambio, puedes ignorar este correo."
            try:
                if mail:
                    mail.send(msg)
                else:
                    current_app.logger.debug(f"Mail disabled, recovery link: {recover_url}")
            except Exception as e:
                # Log the error but DO NOT return 500 — allow flow to continue in development.
                current_app.logger.exception('Error sending recovery email')
                traceback.print_exc()
                current_app.logger.error('Continuing despite mail send error; recovery link was: %s', recover_url)
                # Do not expose full trace to client; respond as if instructions were sent.
                # This prevents a 500 when SMTP is not configured during development.
                pass

        # Responder siempre de forma ambigua para seguridad
        return jsonify({"message": "Si el correo está registrado, recibirás un enlace pronto."}), 200
    except Exception as e:
        traceback.print_exc()
        current_app.logger.exception('Unhandled error in recuperar_password')
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500


@auth_bp.route('/reset/<token>', methods=['POST'])
def reset_with_token(token):
    serializer = URLSafeTimedSerializer(current_app.config.get('SECRET_KEY', 'supersecretkey'))
    try:
        email = serializer.loads(token, salt='recuperar-password-salt', max_age=1800)
    except Exception:
        return jsonify({"error": "El enlace es inválido o ha expirado"}), 400

    data = request.get_json() or {}
    nueva_pass = data.get('password')
    if not nueva_pass:
        return jsonify({"error": "La nueva contraseña es requerida"}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        user.set_password(nueva_pass)
        db.session.commit()
        return jsonify({"message": "Contraseña actualizada con éxito"}), 200

    return jsonify({"error": "Usuario no encontrado"}), 404


@auth_bp.route('/submit_attendance', methods=['POST'])
def submit_attendance():
    from datetime import datetime

    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    data = request.get_json() or {}
    course_id = data.get('course_id')
    input_code = data.get('code')

    if not course_id or not input_code:
        return jsonify({"error": "course_id y code son requeridos"}), 400

    user = User.query.filter_by(username=session['username']).first()
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Curso no encontrado"}), 404

    # Verify enrollment
    inscrito = db.session.query(User_course).filter_by(user_id=user.id, course_id=course_id).first()
    if not inscrito:
        return jsonify({"error": "No estás inscrito en este curso"}), 403

    # Verify code
    if not course.session_code or course.session_code != input_code:
        return jsonify({"error": "Código incorrecto"}), 400

    now = datetime.now()
    # verify within expiry
    if course.session_expires and now > course.session_expires:
        return jsonify({"error": "El código ha expirado"}), 400

    # verify day/time
    try:
        current_day = now.weekday() + 1
        if current_day != course.dia:
            return jsonify({"error": "No es el día de la clase"}), 400
        current_time = now.time()
        if not (course.start_time <= current_time <= course.end_time):
            return jsonify({"error": "Fuera del horario de clase"}), 400
    except Exception:
        pass

    # avoid duplicates same day
    exists = Asistencia.query.filter_by(user_id=user.id, course_id=course_id, date=now.date()).first()
    if exists:
        return jsonify({"error": "Ya marcaste asistencia hoy"}), 409

    nueva_asistencia = Asistencia(
        user_id=user.id,
        course_id=course.id,
        date=now.date(),
        time=now.time(),
        state="Presente"
    )
    db.session.add(nueva_asistencia)
    db.session.commit()

    return jsonify({"message": "Asistencia registrada con éxito"}), 201


@auth_bp.route('/bulk_attendance', methods=['POST'])
def bulk_attendance():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user or (user.role != 'teacher' and not (user.role == 'student' and user.es_comandante)):
        return jsonify({"error": "Solo profesores y comandantes pueden actualizar asistencia masiva"}), 403

    data = request.get_json() or {}
    course_id = data.get('course_id')
    attendance = data.get('attendance', [])

    if not course_id:
        return jsonify({"error": "course_id requerido"}), 400

    now = datetime.now()
    today = now.date()
    current_time = now.time()

    from backend.models import LogAsistencia

    for item in attendance:
        try:
            uid = int(item.get('user_id'))
            state = item.get('state')
            if state not in ('Presente', 'Ausente', 'Justificado'):
                continue
        except Exception:
            continue

        asistencia = Asistencia.query.filter_by(user_id=uid, course_id=course_id, date=today).first()
        estado_anterior = asistencia.state if asistencia else None
        
        alumno = User.query.get(uid)
        nombre_alumno = f"{alumno.primer_nombre} {alumno.primer_apellido}" if alumno and alumno.primer_nombre else (alumno.username if alumno else 'Desconocido')
        
        if not asistencia:
            asistencia = Asistencia(user_id=uid, course_id=course_id, date=today, time=current_time, state=state)
            db.session.add(asistencia)
            accion = f'Cambió estado de {nombre_alumno} de Ausente a {state}'
        else:
            if asistencia.state != state:
                accion = f'Cambió estado de {nombre_alumno} de {estado_anterior} a {state}'
                asistencia.state = state
            else:
                continue
        
        log = LogAsistencia(
            course_id=course_id,
            user_id=uid,
            modificado_por=user.id,
            accion=accion,
            estado_anterior=estado_anterior,
            estado_nuevo=state,
            fecha=today,
            hora=current_time
        )
        db.session.add(log)

    db.session.commit()
    return jsonify({"message": "Asistencia actualizada correctamente"}), 200


@auth_bp.route('/subir_justificativo', methods=['POST'])
def subir_justificativo():
    if 'username' not in session:
        return redirect(url_for('front.login_page'))
    
    user = User.query.filter_by(username=session['username']).first()
    course_id = request.form.get('course_id')
    fecha_clase = request.form.get('fecha_clase')
    motivo = request.form.get('motivo')
    archivo = request.files.get('archivo')
    
    if not course_id or not motivo:
        return redirect(url_for('front.cargar_justificativo'))
    
    archivo_nombre = None
    if archivo:
        filename = secure_filename(archivo.filename)
        upload_folder = os.path.join(current_app.root_path, 'frontend', 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        archivo_nombre = f"{user.id}_{int(datetime.now().timestamp())}_{filename}"
        archivo.save(os.path.join(upload_folder, archivo_nombre))
    
    justificativo = Justificativo(
        user_id=user.id,
        course_id=course_id,
        fecha_clase=fecha_clase or datetime.now().strftime('%Y-%m-%d'),
        motivo=motivo,
        archivo_nombre=archivo_nombre,
        estado='Pendiente'
    )
    db.session.add(justificativo)
    db.session.commit()
    
    return redirect(url_for('front.dashboard'))


@auth_bp.route('/serve_file/<filename>')
def serve_file(filename):
    from flask import send_from_directory, current_app
    import os
    upload_folder = os.path.join(current_app.root_path, 'frontend', 'static', 'uploads')
    return send_from_directory(upload_folder, filename)

@auth_bp.route('/resolver_justificativo/<int:justificativo_id>', methods=['POST'])
def resolver_justificativo(justificativo_id):
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    
    user = User.query.filter_by(username=session['username']).first()
    if not user or (user.role != 'teacher' and not (user.role == 'student' and user.es_comandante)):
        return jsonify({"error": "Solo profesores y comandantes pueden resolver justificativos"}), 403
    
    data = request.get_json() or {}
    nuevo_estado = data.get('estado')
    
    if nuevo_estado not in ('Aceptado', 'Rechazado'):
        return jsonify({"error": "Estado inválido"}), 400
    
    justificativo = Justificativo.query.get(justificativo_id)
    if not justificativo:
        return jsonify({"error": "Justificativo no encontrado"}), 404
    
    justificativo.estado = nuevo_estado
    
    now = datetime.now()
    from backend.models import LogAsistencia
    
    if nuevo_estado == 'Aceptado':
        try:
            fecha = datetime.strptime(justificativo.fecha_clase, '%Y-%m-%d').date()
        except:
            fecha = datetime.now().date()
        
        asistencia = Asistencia.query.filter_by(
            user_id=justificativo.user_id,
            course_id=justificativo.course_id,
            date=fecha
        ).first()
        
        if asistencia:
            asistencia.state = 'Justificado'
        else:
            nueva_asistencia = Asistencia(
                user_id=justificativo.user_id,
                course_id=justificativo.course_id,
                date=fecha,
                time=datetime.now().time(),
                state='Justificado'
            )
            db.session.add(nueva_asistencia)
        
        # Log de aceptación
        alumno = User.query.get(justificativo.user_id)
        log = LogAsistencia(
            course_id=justificativo.course_id,
            user_id=justificativo.user_id,
            modificado_por=user.id,
            accion=f'Aceptó justificativo de {alumno.primer_nombre} {alumno.primer_apellido}',
            estado_anterior=None,
            estado_nuevo='Justificado',
            fecha=now.date(),
            hora=now.time()
        )
        db.session.add(log)
    else:
        # Log de rechazo
        alumno = User.query.get(justificativo.user_id)
        log = LogAsistencia(
            course_id=justificativo.course_id,
            user_id=justificativo.user_id,
            modificado_por=user.id,
            accion=f'Rechazó justificativo de {alumno.primer_nombre} {alumno.primer_apellido}',
            estado_anterior=None,
            estado_nuevo=None,
            fecha=now.date(),
            hora=now.time()
        )
        db.session.add(log)
    
    db.session.commit()
    return jsonify({"message": f"Justificativo {nuevo_estado.lower()}"}), 200


@auth_bp.route('/guardar_historial', methods=['POST'])
def guardar_historial():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user or (user.role != 'teacher' and not (user.role == 'student' and user.es_comandante)):
        return jsonify({"error": "Solo profesores y comandantes pueden guardar historial"}), 403

    data = request.get_json() or {}
    course_id = data.get('course_id')
    
    if not course_id:
        return jsonify({"error": "course_id requerido"}), 400

    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Curso no encontrado"}), 404

    now = datetime.now()
    today = now.date()
    
    # Verificar si ya existe un historial para este curso en este día
    historial_existente = HistorialAsistencia.query.filter_by(course_id=course_id, fecha=today).first()
    
    # Obtener asistencias del día
    asistencias_hoy = Asistencia.query.filter_by(course_id=course_id, date=today).all()
    
    # Obtener todos los alumnos inscritos
    alumnos_inscritos = db.session.query(User).join(User_course, User.id == User_course.user_id).filter(User_course.course_id == course_id, User.role == 'student').all()
    
    # Mapear estados desde la tabla Asistencia
    mapa_estados = {a.user_id: a.state for a in asistencias_hoy}
    
    # Contar estados
    total_alumnos = len(alumnos_inscritos)
    total_presentes = sum(1 for a in alumnos_inscritos if mapa_estados.get(a.id) == 'Presente')
    total_justificados = sum(1 for a in alumnos_inscritos if mapa_estados.get(a.id) == 'Justificado')
    total_ausentes = total_alumnos - total_presentes - total_justificados
    
    if historial_existente:
        # Actualizar historial existente
        historial_existente.hora = now.time()
        historial_existente.total_alumnos = total_alumnos
        historial_existente.total_presentes = total_presentes
        historial_existente.total_justificados = total_justificados
        historial_existente.total_ausentes = total_ausentes
        
        # Eliminar detalles antiguos
        DetalleAsistencia.query.filter_by(historial_id=historial_existente.id).delete()
        
        # Crear nuevos detalles
        for alumno in alumnos_inscritos:
            estado = mapa_estados.get(alumno.id, 'Ausente')
            detalle = DetalleAsistencia(
                historial_id=historial_existente.id,
                user_id=alumno.id,
                estado=estado
            )
            db.session.add(detalle)
        
        db.session.commit()
        
        return jsonify({
            "message": "Historial actualizado exitosamente",
            "codigo_sesion": historial_existente.codigo_sesion,
            "historial_id": historial_existente.id
        }), 200
    else:
        # Crear nuevo historial
        codigo_sesion = f"{secrets.randbelow(10000):04d}-{secrets.randbelow(10000):04d}-{secrets.randbelow(10000):04d}"
        
        historial = HistorialAsistencia(
            course_id=course_id,
            fecha=today,
            hora=now.time(),
            codigo_sesion=codigo_sesion,
            total_alumnos=total_alumnos,
            total_presentes=total_presentes,
            total_justificados=total_justificados,
            total_ausentes=total_ausentes
        )
        db.session.add(historial)
        db.session.flush()
        
        # Crear detalles para cada alumno
        for alumno in alumnos_inscritos:
            estado = mapa_estados.get(alumno.id, 'Ausente')
            detalle = DetalleAsistencia(
                historial_id=historial.id,
                user_id=alumno.id,
                estado=estado
            )
            db.session.add(detalle)
        
        db.session.commit()
        
        return jsonify({
            "message": "Historial guardado exitosamente",
            "codigo_sesion": codigo_sesion,
            "historial_id": historial.id
        }), 201


@auth_bp.route('/actualizar_aula', methods=['POST'])
def actualizar_aula():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user or (user.role != 'teacher' and not (user.role == 'student' and user.es_comandante)):
        return jsonify({"error": "Solo profesores y comandantes pueden actualizar el aula"}), 403
    
    data = request.get_json() or {}
    course_id = data.get('course_id')
    aula = data.get('aula', '').strip()
    
    if not course_id:
        return jsonify({"error": "course_id requerido"}), 400
    
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Curso no encontrado"}), 404
    
    course.aula = aula if aula else None
    db.session.commit()
    
    return jsonify({"message": "Aula actualizada", "aula": course.aula}), 200


@auth_bp.route('/google/login')
def google_login():
    # Verificar si OAuth está configurado
    if not current_app.config.get('GOOGLE_CLIENT_ID') or not current_app.config.get('GOOGLE_CLIENT_SECRET'):
        return jsonify({"error": "Google OAuth no está configurado"}), 503
    
    redirect_uri = url_for('auth.google_callback', _external=True)
    print(f"Google OAuth redirect URI: {redirect_uri}")
    return oauth.google.authorize_redirect(redirect_uri)


@auth_bp.route('/google/callback')
def google_callback():
    try:
        token = oauth.google.authorize_access_token()
        user_info = token.get('userinfo')
        
        if not user_info:
            return redirect(url_for('front.register_page'))
        
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            user = User(username=name, email=email)
            user.set_password(secrets.token_urlsafe(16))
            db.session.add(user)
            db.session.commit()
        
        session['username'] = user.username
        return redirect(url_for('front.dashboard'))
    
    except Exception as e:
        print(f"Error en Google OAuth: {e}")
        return redirect(url_for('front.register_page'))


@auth_bp.route('/complete_profile', methods=['POST'])
def complete_profile():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    
    user = User.query.filter_by(username=session['username']).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    data = request.get_json() or {}
    
    # Actualizar datos del usuario
    user.primer_nombre = data.get('primer_nombre', '').strip()
    user.primer_apellido = data.get('primer_apellido', '').strip()
    user.ci = data.get('ci', '').strip()
    
    # Guardar career para backwards compatibility (código antiguo usa este campo)
    # Y también intentar mapear a carrera_id si se proporciona el ID de carrera
    career_value = data.get('career', '').strip()
    carrera_id_value = data.get('carrera_id')
    
    if user.role in ('estudiante', 'student'):
        user.career = career_value
        # Si se proporciona carrera_id, también guardarlo
        if carrera_id_value:
            user.carrera_id = int(carrera_id_value)
    else:
        user.career = 'Profesor'
    
    if not all([user.primer_nombre, user.primer_apellido, user.ci]):
        return jsonify({"error": "Nombre, apellido y cédula son requeridos"}), 400
    
    if user.role in ('estudiante', 'student') and not user.career and not user.carrera_id:
        return jsonify({"error": "La carrera es requerida para estudiantes"}), 400
    
    # Inscribir en materias seleccionadas
    course_ids = data.get('courses', [])
    if not course_ids:
        return jsonify({"error": "Debes seleccionar al menos una materia"}), 400
    
    # Eliminar inscripciones anteriores
    User_course.query.filter_by(user_id=user.id).delete()
    
    # Agregar nuevas inscripciones
    for course_id in course_ids:
        inscripcion = User_course(user_id=user.id, course_id=int(course_id))
        db.session.add(inscripcion)
    
    db.session.commit()
    
    return jsonify({"message": "Perfil completado exitosamente"}), 200


@auth_bp.route('/actualizar_perfil', methods=['POST'])
def actualizar_perfil():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    data = request.get_json() or {}
    user.primer_nombre = data.get('primer_nombre', user.primer_nombre)
    user.primer_apellido = data.get('primer_apellido', user.primer_apellido)
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify({"message": "Perfil actualizado"}), 200


@auth_bp.route('/cambiar_password', methods=['POST'])
def cambiar_password():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    data = request.get_json() or {}
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    if not user.check_password(current_password):
        return jsonify({"error": "Contraseña actual incorrecta"}), 400
    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Contraseña actualizada"}), 200


@auth_bp.route('/actualizar_notificaciones', methods=['POST'])
def actualizar_notificaciones():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    data = request.get_json() or {}
    user.notificaciones_activas = data.get('notificaciones_activas', True)
    db.session.commit()
    return jsonify({"message": "Notificaciones actualizadas"}), 200


@auth_bp.route('/actualizar_formato_hora', methods=['POST'])
def actualizar_formato_hora():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    data = request.get_json() or {}
    user.formato_hora = data.get('formato_hora', '12h')
    db.session.commit()
    return jsonify({"message": "Formato de hora actualizado"}), 200


@auth_bp.route('/subir_avatar', methods=['POST'])
def subir_avatar():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    archivo = request.files.get('avatar')
    if not archivo:
        return jsonify({"error": "No se envió archivo"}), 400
    filename = secure_filename(archivo.filename)
    upload_folder = os.path.join(current_app.root_path, 'frontend', 'static', 'uploads', 'avatars')
    os.makedirs(upload_folder, exist_ok=True)
    avatar_nombre = f"{user.id}_{int(datetime.now().timestamp())}_{filename}"
    archivo.save(os.path.join(upload_folder, avatar_nombre))
    user.avatar_url = f"/static/uploads/avatars/{avatar_nombre}"
    db.session.commit()
    return jsonify({"message": "Avatar actualizado", "avatar_url": user.avatar_url}), 200


@auth_bp.route('/gestionar_cursos', methods=['POST'])
def gestionar_cursos():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    data = request.get_json() or {}
    course_ids = data.get('courses', [])
    User_course.query.filter_by(user_id=user.id).delete()
    for course_id in course_ids:
        inscripcion = User_course(user_id=user.id, course_id=int(course_id))
        db.session.add(inscripcion)
    db.session.commit()
    return jsonify({"message": "Cursos actualizados"}), 200


@auth_bp.route('/eliminar_cuenta', methods=['POST'])
def eliminar_cuenta():
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user = User.query.filter_by(username=session['username']).first()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    data = request.get_json() or {}
    password = data.get('password')
    if not user.check_password(password):
        return jsonify({"error": "Contraseña incorrecta"}), 400
    User_course.query.filter_by(user_id=user.id).delete()
    Asistencia.query.filter_by(user_id=user.id).delete()
    Justificativo.query.filter_by(user_id=user.id).delete()
    DetalleAsistencia.query.filter_by(user_id=user.id).delete()
    db.session.delete(user)
    db.session.commit()
    session.pop('username', None)
    return jsonify({"message": "Cuenta eliminada"}), 200


@auth_bp.route('/toggle_comandante/<int:user_id>', methods=['POST'])
def toggle_comandante(user_id):
    if 'username' not in session:
        return jsonify({"error": "No autorizado"}), 401
    admin = User.query.filter_by(username=session['username']).first()
    if not admin or admin.role != 'teacher':
        return jsonify({"error": "Solo profesores pueden asignar comandantes"}), 403
    
    user = User.query.get(user_id)
    if not user or user.role != 'student':
        return jsonify({"error": "Usuario no encontrado o no es estudiante"}), 404
    
    user.es_comandante = not user.es_comandante
    db.session.commit()
    
    return jsonify({
        "message": f"Comandante {'activado' if user.es_comandante else 'desactivado'}",
        "es_comandante": user.es_comandante
    }), 200


@auth_bp.route('/fix_sequences_temp', methods=['GET'])
def fix_sequences_temp():
    from sqlalchemy import text
    try:
        tables = [
            ('"user"', 'user_id_seq'),
            ('course', 'course_id_seq'),
            ('user_course', 'user_course_id_seq'),
            ('asistencia', 'asistencia_id_seq'),
            ('justificativo', 'justificativo_id_seq'),
            ('historial_asistencia', 'historial_asistencia_id_seq'),
            ('detalle_asistencia', 'detalle_asistencia_id_seq'),
            ('log_asistencia', 'log_asistencia_id_seq')
        ]
        results = []
        for table, seq in tables:
            result = db.session.execute(text(f"SELECT COALESCE(MAX(id), 0) + 1 FROM {table}")).scalar()
            db.session.execute(text(f"ALTER SEQUENCE {seq} RESTART WITH {result}"))
            results.append(f"{table}: {result}")
        db.session.commit()
        return jsonify({"message": "Secuencias reseteadas", "results": results}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/update_horarios_temp', methods=['GET'])
def update_horarios_temp():
    from sqlalchemy import text
    try:
        updates = [
            ("UPDATE course SET start_time = '04:00:00', end_time = '08:00:00' WHERE name = 'Inglés'", "Inglés: 04:00-08:00"),
            ("UPDATE course SET start_time = '08:00:00', end_time = '12:00:00' WHERE name = 'Matemáticas'", "Matemáticas: 08:00-12:00"),
            ("UPDATE course SET start_time = '12:00:00', end_time = '23:59:59' WHERE name = 'Historia'", "Historia: 12:00-23:59"),
            ("UPDATE course SET start_time = '04:00:00', end_time = '20:00:00' WHERE name = 'Programación'", "Programación: 04:00-20:00"),
            ("UPDATE course SET start_time = '04:00:00', end_time = '08:00:00' WHERE name = 'Educación Física'", "Educación Física: 04:00-08:00"),
        ]
        results = []
        for query, desc in updates:
            db.session.execute(text(query))
            results.append(desc)
        db.session.commit()
        return jsonify({"message": "Horarios actualizados", "results": results}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500