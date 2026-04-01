"""
Modelos de la base de datos - AVA 2.0 Redesign
Sistema de Asistencia con soporte multi-institución y multi-semestre
"""
from datetime import datetime
from backend.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash


# =============================================================================
# TABLAS DE CATÁLOGO (Estáticas)
# =============================================================================

class Institucion(db.Model):
    """Instituciones/Facultades del sistema"""
    __tablename__ = 'institucion'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    codigo = db.Column(db.String(50), unique=True, nullable=False)
    logo_url = db.Column(db.String(500), nullable=True)
    direccion = db.Column(db.String(300), nullable=True)
    telefono = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(150), nullable=True)
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    carreras = db.relationship('Carrera', backref='institucion', lazy='dynamic')
    periodos = db.relationship('PeriodoAcademico', backref='institucion', lazy='dynamic')

    def __repr__(self):
        return f'<Institucion {self.nombre}>'


class Carrera(db.Model):
    """Carreras/Ingenierías por institución"""
    __tablename__ = 'carrera'

    id = db.Column(db.Integer, primary_key=True)
    institucion_id = db.Column(db.Integer, db.ForeignKey('institucion.id'), nullable=False)
    nombre = db.Column(db.String(200), nullable=False)
    codigo = db.Column(db.String(50), nullable=False)  # ej: "MEC", "SIS"
    duracion_semestres = db.Column(db.Integer, default=10)
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    asignaturas = db.relationship('Asignatura', backref='carrera', lazy='dynamic')
    comandantes = db.relationship('User', backref='carrera_dirigida', foreign_keys='User.carrera_id', lazy='dynamic')

    __table_args__ = (
        db.UniqueConstraint('institucion_id', 'codigo', name='uq_carrera_codigo'),
    )

    def __repr__(self):
        return f'<Carrera {self.codigo} - {self.nombre}>'


class Asignatura(db.Model):
    """Materias/Asignaturas por carrera"""
    __tablename__ = 'asignatura'

    id = db.Column(db.Integer, primary_key=True)
    carrera_id = db.Column(db.Integer, db.ForeignKey('carrera.id'), nullable=False)
    codigo = db.Column(db.String(50), nullable=False)  # ej: "MEC-101"
    nombre = db.Column(db.String(200), nullable=False)
    semestre = db.Column(db.Integer, nullable=False)  # 1-10
    uv = db.Column(db.Integer, default=4)  # Unidades de valor
    descripcion = db.Column(db.Text, nullable=True)
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    secciones = db.relationship('Seccion', backref='asignatura', lazy='dynamic')
    especialidades = db.relationship('ProfesorEspecialidad', backref='asignatura', lazy='dynamic')

    __table_args__ = (
        db.UniqueConstraint('carrera_id', 'codigo', name='uq_asignatura_codigo'),
    )

    def __repr__(self):
        return f'<Asignatura {self.codigo} - {self.nombre}>'


class PeriodoAcademico(db.Model):
    """Semestres/Períodos académicos"""
    __tablename__ = 'periodo_academico'

    id = db.Column(db.Integer, primary_key=True)
    institucion_id = db.Column(db.Integer, db.ForeignKey('institucion.id'), nullable=False)
    nombre = db.Column(db.String(50), nullable=False)  # ej: "1-2026", "2-2026"
    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=False)
    activo = db.Column(db.Boolean, default=True)
    es_actual = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    secciones = db.relationship('Seccion', backref='periodo', lazy='dynamic')

    __table_args__ = (
        db.UniqueConstraint('institucion_id', 'nombre', name='uq_periodo_nombre'),
    )

    def __repr__(self):
        return f'<PeriodoAcademico {self.nombre}>'


# =============================================================================
# TABLAS DE USUARIOS
# =============================================================================

class User(db.Model):
    """Usuarios del sistema"""
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    
    # Roles: estudiante, profesor, comandante, admin
    role = db.Column(db.String(50), nullable=False, default='estudiante')
    
    # Datos personales
    primer_nombre = db.Column(db.String(100), nullable=True)
    primer_apellido = db.Column(db.String(100), nullable=True)
    ci = db.Column(db.String(20), nullable=True)
    telefono = db.Column(db.String(20), nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    
    # Configuración
    notificaciones_activas = db.Column(db.Boolean, default=True)
    formato_hora = db.Column(db.String(10), default='12h')
    
    # Relaciones institucionales
    carrera_id = db.Column(db.Integer, db.ForeignKey('carrera.id'), nullable=True)  # Para estudiantes
    institucion_id = db.Column(db.ForeignKey('institucion.id'), nullable=True)  # Para todos
    
    # Campo career legacy (para compatibilidad con código antiguo)
    # Este campo será migrado a carrera_id eventualmente
    career = db.Column(db.String(100), nullable=True)
    
    # Flags
    es_comandante = db.Column(db.Boolean, default=False)
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Métodos de autenticación
    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    # Relaciones
    inscripciones = db.relationship('Inscripcion', backref='estudiante', lazy='dynamic', foreign_keys='Inscripcion.estudiante_id')
    secciones_dicta = db.relationship('Seccion', backref='profesor', lazy='dynamic', foreign_keys='Seccion.profesor_id')
    especialidades = db.relationship('ProfesorEspecialidad', backref='profesor', lazy='dynamic')

    def __repr__(self):
        return f'<User {self.username} ({self.role})>'


class ProfesorEspecialidad(db.Model):
    """Especialidades/Materias que dicta cada profesor"""
    __tablename__ = 'profesor_especialidad'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    asignatura_id = db.Column(db.Integer, db.ForeignKey('asignatura.id'), nullable=False)
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'asignatura_id', name='uq_profesor_asignatura'),
    )

    def __repr__(self):
        return f'<ProfesorEspecialidad {self.user_id} - {self.asignatura_id}>'


# =============================================================================
# TABLAS DE OPERACIÓN (Dinámicas)
# =============================================================================

class Seccion(db.Model):
    """Secciones/Grupos de una asignatura en un período"""
    __tablename__ = 'seccion'

    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(50), unique=True, nullable=False)  # ej: "02S-MEC-2622-N1"
    
    # Foreign Keys
    asignatura_id = db.Column(db.Integer, db.ForeignKey('asignatura.id'), nullable=False)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodo_academico.id'), nullable=False)
    profesor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Horario y ubicación
    aula = db.Column(db.String(100), nullable=True)
    dia = db.Column(db.Integer, nullable=False)  # 0=Lunes, 6=Domingo
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    capacidad = db.Column(db.Integer, default=30)
    activo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    inscripciones = db.relationship('Inscripcion', backref='seccion', lazy='dynamic')

    __table_args__ = (
        db.UniqueConstraint('asignatura_id', 'periodo_id', 'codigo', name='uq_seccion_codigo'),
    )

    def __repr__(self):
        return f'<Seccion {self.codigo}>'


class Inscripcion(db.Model):
    """Inscripciones de estudiantes a secciones"""
    __tablename__ = 'inscripcion'

    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    seccion_id = db.Column(db.Integer, db.ForeignKey('seccion.id'), nullable=False)
    estado = db.Column(db.String(20), default='activa')  # activa, retraitada, suspendida
    fecha_inscripcion = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('estudiante_id', 'seccion_id', name='uq_inscripcion_estudiante_seccion'),
    )

    def __repr__(self):
        return f'<Inscripcion estudiante={self.estudiante_id} seccion={self.seccion_id}>'


# =============================================================================
# MODELOS LEGACY (para compatibilidad durante migración)
# =============================================================================

class Course(db.Model):
    """Modelo legacy - mantenido para compatibilidad durante migración"""
    __tablename__ = 'course'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    aula = db.Column(db.String(100), nullable=True)
    dia = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    session_code = db.Column(db.String(10), nullable=True)
    session_expires = db.Column(db.DateTime, nullable=True)

    # Relaciones legacy para compatibilidad
    users = db.relationship('User', secondary='user_course', backref=db.backref('courses', lazy='dynamic'))

    def __repr__(self):
        return f'<Course {self.name}>'


class User_course(db.Model):
    """Modelo legacy - mantenido para compatibilidad durante migración"""
    __tablename__ = 'user_course'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)

    def __repr__(self):
        return f'<User_course user_id={self.user_id} course_id={self.course_id}>'


class Asistencia(db.Model):
    """Modelo legacy - mantenido para compatibilidad durante migración"""
    __tablename__ = 'asistencia'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    state = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f'<Asistencia user_id={self.user_id} course_id={self.course_id}>'


class Justificativo(db.Model):
    """Modelo legacy - mantenido para compatibilidad durante migración"""
    __tablename__ = 'justificativo'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    fecha_clase = db.Column(db.String(20), nullable=False)
    motivo = db.Column(db.Text, nullable=False)
    archivo_nombre = db.Column(db.String(100))
    estado = db.Column(db.String(20), default='Pendiente')

    def __repr__(self):
        return f'<Justificativo id={self.id}>'


class HistorialAsistencia(db.Model):
    """Modelo legacy - mantenido para compatibilidad durante migración"""
    __tablename__ = 'historial_asistencia'

    id = db.Column(db.Integer, primary_key=True)
    # FK legacy (para Course)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=True)
    # FK nuevo (para Seccion)
    seccion_id = db.Column(db.Integer, db.ForeignKey('seccion.id'), nullable=True)
    fecha = db.Column(db.Date, nullable=False)
    hora = db.Column(db.Time, nullable=False)
    codigo_sesion = db.Column(db.String(20), nullable=False)
    total_alumnos = db.Column(db.Integer, default=0)
    total_presentes = db.Column(db.Integer, default=0)
    total_justificados = db.Column(db.Integer, default=0)
    total_ausentes = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<HistorialAsistencia course_id={self.course_id} seccion_id={self.seccion_id} fecha={self.fecha}>'


class DetalleAsistencia(db.Model):
    """Modelo legacy - mantido para compatibilidad durante migración"""
    __tablename__ = 'detalle_asistencia'

    id = db.Column(db.Integer, primary_key=True)
    historial_id = db.Column(db.Integer, db.ForeignKey('historial_asistencia.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    estado = db.Column(db.String(20), nullable=False)
    hora_registro = db.Column(db.Time, nullable=True)

    def __repr__(self):
        return f'<DetalleAsistencia historial_id={self.historial_id} user_id={self.user_id}>'


class LogAsistencia(db.Model):
    """Modelo legacy - mantenido para compatibilidad durante migración"""
    __tablename__ = 'log_asistencia'

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    modificado_por = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    accion = db.Column(db.String(255), nullable=False)
    estado_anterior = db.Column(db.String(50), nullable=True)
    estado_nuevo = db.Column(db.String(50), nullable=True)
    fecha = db.Column(db.Date, nullable=False)
    hora = db.Column(db.Time, nullable=False)
    detalles = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<LogAsistencia accion={self.accion}>'


# =============================================================================
# MODELOS DE PROFESOR
# =============================================================================

class CodigoProfesor(db.Model):
    """Códigos únicos para registro de profesores (4 dígitos alfanuméricos)"""
    __tablename__ = 'codigo_profesor'

    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(20), unique=True, nullable=False)  # ej: "PROF-1234"
    usado = db.Column(db.Boolean, default=False)
    usado_por = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<CodigoProfesor {self.codigo} usado={self.usado}>'


class CodigoAsistencia(db.Model):
    """Códigos temporales para marcar asistencia en clase"""
    __tablename__ = 'codigo_asistencia'

    id = db.Column(db.Integer, primary_key=True)
    seccion_id = db.Column(db.Integer, db.ForeignKey('seccion.id'), nullable=False)
    codigo = db.Column(db.String(4), nullable=False)  # 4 dígitos
    fecha = db.Column(db.Date, default=datetime.utcnow)
    expira = db.Column(db.DateTime, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    seccion = db.relationship('Seccion', backref='codigos_asistencia', lazy=True)
    profesor = db.relationship('User', backref='codigos_generados', lazy=True)

    def __repr__(self):
        return f'<CodigoAsistencia {self.codigo} seccion={self.seccion_id}>'


class AsistenciaManual(db.Model):
    """Registro de asistencia marcada manualmente por el profesor"""
    __tablename__ = 'asistencia_manual'

    id = db.Column(db.Integer, primary_key=True)
    seccion_id = db.Column(db.Integer, db.ForeignKey('seccion.id'), nullable=False)
    alumno_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    estado = db.Column(db.String(20), nullable=False, default='presente')  # presente, ausente, justificado
    fecha = db.Column(db.Date, default=datetime.utcnow)
    marcado_por = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    seccion = db.relationship('Seccion', backref='asistencias_manuales', lazy=True)
    alumno = db.relationship('User', foreign_keys=[alumno_id], backref='asistencias_alumno', lazy=True)
    profesor = db.relationship('User', foreign_keys=[marcado_por], backref='asistencias_marcadas', lazy=True)

    def __repr__(self):
        return f'<AsistenciaManual alumno={self.alumno_id} estado={self.estado}>'


class LogAsistenciaProfesor(db.Model):
    """Historial de cambios de asistencia (auditoría)"""
    __tablename__ = 'log_asistencia_profesor'

    id = db.Column(db.Integer, primary_key=True)
    asistencia_id = db.Column(db.Integer, db.ForeignKey('asistencia_manual.id'), nullable=True)
    alumno_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    seccion_id = db.Column(db.Integer, db.ForeignKey('seccion.id'), nullable=False)
    estado_anterior = db.Column(db.String(20), nullable=True)
    estado_nuevo = db.Column(db.String(20), nullable=False)
    modificado_por = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<LogAsistenciaProfesor alumno={self.alumno_id} {self.estado_anterior}→{self.estado_nuevo}>'
