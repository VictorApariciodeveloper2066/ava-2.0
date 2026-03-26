"""
Tests for new database models - AVA 2.0 Redesign
"""
import pytest
from backend.models import (
    Institucion, Carrera, Asignatura, PeriodoAcademico,
    User, Seccion, Inscripcion, Asistencia, Justificativo
)

class TestInstitucion:
    def test_create_institucion(self, db, institucion_factory):
        inst = institucion_factory()
        assert inst.id is not None
        assert inst.nombre is not None
        assert inst.codigo is not None

class TestCarrera:
    def test_create_carrera(self, db, carrera_factory):
        carrera = carrera_factory()
        assert carrera.id is not None
        assert carrera.codigo is not None

class TestUser:
    def test_create_user(self, db, user_factory):
        user = user_factory()
        assert user.id is not None
        assert user.username is not None
        assert user.role == "estudiante"

    def test_password_hashing(self, db, user_factory):
        user = user_factory(password="MyPass123!")
        assert user.check_password("MyPass123!") is True
        assert user.check_password("Wrong") is False
