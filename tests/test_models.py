import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from backend.models import User, Course

def test_user_creation(user_factory):
    """Test user creation and password hashing."""
    user = user_factory()
    assert user.id is not None
    assert user.check_password("TestPassword123!")
    assert not user.check_password("wrong")
    assert user.role == "student"
    assert user.primer_nombre == "Test"
    assert user.primer_apellido == "User"

def test_user_roles(user_factory):
    """Test different user roles."""
    admin = user_factory(role="teacher", es_comandante=True)
    student = user_factory(role="student")
    
    assert admin.role == "teacher"
    assert admin.es_comandante == True
    assert student.role == "student"
    assert not student.es_comandante

def test_course_creation(course_factory):
    """Test course creation."""
    course = course_factory()
    assert course.id is not None
    assert "Test Course" in course.name
    assert course.dia == 1
    assert course.aula == "A-101"
    assert course.start_time.strftime("%H:%M:%S") == "08:00:00"
    assert course.end_time.strftime("%H:%M:%S") == "10:00:00"

def test_user_course_relationship(user_factory, course_factory, db):
    """Test many-to-many relationship between users and courses."""
    user = user_factory()
    course1 = course_factory()
    course2 = course_factory()
    
    user.courses.append(course1)
    user.courses.append(course2)
    db.session.commit()
    
    assert len(user.courses) == 2
    assert course1 in user.courses
    assert course2 in user.courses
    
    # Test reverse relationship
    assert user in course1.users
    assert user in course2.users