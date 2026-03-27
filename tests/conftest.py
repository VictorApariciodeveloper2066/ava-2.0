import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from app import create_app
from backend.extensions import db as _db
from backend.models import (
    User, Course, Institucion, Carrera, Asignatura,
    PeriodoAcademico, Seccion, Inscripcion
)

@pytest.fixture(scope='session')
def app():
    """Create and configure a new app instance for each test session."""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "WTF_CSRF_ENABLED": False,
        "GOOGLE_CLIENT_ID": "test-client-id",
        "GOOGLE_CLIENT_SECRET": "test-client-secret",
        "MAIL_SERVER": "localhost",
        "MAIL_PORT": 25,
        "MAIL_USE_TLS": False,
        "MAIL_USERNAME": None,
        "MAIL_PASSWORD": None,
        # JWT config for tests
        "JWT_SECRET_KEY": "test-secret-key-minimum-32-chars-long!!",
        "JWT_ACCESS_TOKEN_EXPIRES": 3600,
        "JWT_REFRESH_TOKEN_EXPIRES": 86400
    })
    return app

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture
def db(app):
    """Session database fixture."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()

# Factories for creating objects of test
@pytest.fixture
def user_factory(db):
    def create_user(**kwargs):
        # Use a unique username and email to avoid conflicts
        import uuid
        unique_id = uuid.uuid4().hex[:8]
        defaults = {
            "username": f"testuser_{unique_id}",
            "email": f"test_{unique_id}@example.com",
            "password": "TestPassword123!",
            "role": "student",
            "primer_nombre": "Test",
            "primer_apellido": "User",
            "ci": "12345678"
        }
        defaults.update(kwargs)
        user = User(**defaults)
        user.set_password(defaults["password"])
        db.session.add(user)
        db.session.commit()
        return user
    return create_user

@pytest.fixture
def course_factory(db):
    def create_course(**kwargs):
        import uuid
        from datetime import time
        unique_id = uuid.uuid4().hex[:8]
        defaults = {
            "name": f"Test Course {unique_id}",
            "aula": "A-101",
            "dia": 1,
            "start_time": time(8, 0, 0),  # 8:00:00 AM
            "end_time": time(10, 0, 0)    # 10:00:00 AM
        }
        defaults.update(kwargs)
        course = Course(**defaults)
        db.session.add(course)
        db.session.commit()
        return course
    return create_course


# Factory fixtures for new models
@pytest.fixture
def institucion_factory(db):
    def create_institucion(**kwargs):
        import uuid
        unique_id = uuid.uuid4().hex[:8]
        defaults = {
            "nombre": f"Institución Test {unique_id}",
            "codigo": f"INST-{unique_id[:6].upper()}",
            "direccion": "Dirección de prueba",
            "email": f"test-{unique_id}@institucion.com"
        }
        defaults.update(kwargs)
        institucion = Institucion(**defaults)
        db.session.add(institucion)
        db.session.commit()
        return institucion
    return create_institucion


@pytest.fixture
def carrera_factory(db):
    def create_carrera(institucion=None, **kwargs):
        import uuid
        if institucion is None:
            # Create parent if not provided
            unique_id = uuid.uuid4().hex[:8]
            institucion = Institucion(
                nombre=f"Institución Test {unique_id}",
                codigo=f"INST-{unique_id[:6].upper()}"
            )
            db.session.add(institucion)
            db.session.commit()

        unique_id = uuid.uuid4().hex[:8]
        defaults = {
            "institucion_id": institucion.id,
            "nombre": f"Carrera Test {unique_id}",
            "codigo": f"CAR-{unique_id[:4].upper()}",
            "duracion_semestres": 10
        }
        defaults.update(kwargs)
        carrera = Carrera(**defaults)
        db.session.add(carrera)
        db.session.commit()
        return carrera
    return create_carrera