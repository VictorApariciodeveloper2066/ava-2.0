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
    
