# Modelos del sistema AVA 2.0 Redesign
from .models import (
    # Catálogo
    Institucion,
    Carrera,
    Asignatura,
    PeriodoAcademico,
    # Usuarios
    User,
    ProfesorEspecialidad,
    # Operación
    Seccion,
    Inscripcion,
    Asistencia,
    Justificativo,
    HistorialAsistencia,
    DetalleAsistencia,
    LogAsistencia,
    # Legacy (para compatibilidad temporal)
    Course,
    User_course,
)

__all__ = [
    'Institucion',
    'Carrera',
    'Asignatura',
    'PeriodoAcademico',
    'User',
    'ProfesorEspecialidad',
    'Seccion',
    'Inscripcion',
    'Asistencia',
    'Justificativo',
    'HistorialAsistencia',
    'DetalleAsistencia',
    'LogAsistencia',
    'Course',
    'User_course',
]
