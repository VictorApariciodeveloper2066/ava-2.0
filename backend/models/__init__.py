# Nuevos modelos (rediseño multi-institucional)
from .models import (
    Institucion,
    Carrera,
    Asignatura,
    PeriodoAcademico,
    User,
    ProfesorEspecialidad,
    Seccion,
    Inscripcion,
)

# Modelos legacy (compatibilidad)
from .models import (
    Course,
    User_course,
    Asistencia,
    Justificativo,
    HistorialAsistencia,
    DetalleAsistencia,
    LogAsistencia,
)

# Modelos de profesor
from .models import (
    CodigoProfesor,
    CodigoAsistencia,
    AsistenciaManual,
    LogAsistenciaProfesor,
)
