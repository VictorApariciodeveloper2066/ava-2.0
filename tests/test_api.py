"""
Tests for REST API Endpoints - AVA 2.0
Tests the mobile API endpoints
"""
import pytest
import json


def test_api_login_success(client, user_factory):
    """Test API login returns JWT token"""
    user = user_factory(username='testuser', email='test@test.com', password='TestPass123')
    
    response = client.post('/api/auth/login', 
        json={'username': 'testuser', 'password': 'TestPass123'},
        content_type='application/json'
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data
    assert 'user' in data
    assert data['user']['username'] == 'testuser'


def test_api_login_invalid_credentials(client, db):
    """Test API login with wrong password"""
    response = client.post('/api/auth/login', 
        json={'username': 'nonexistent', 'password': 'wrong'},
        content_type='application/json'
    )
    
    assert response.status_code == 401
    data = response.get_json()
    assert 'error' in data


def test_api_register_success(client, db):
    """Test API register creates user and returns JWT"""
    response = client.post('/api/auth/register',
        json={
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'NewPass123',
            'primer_nombre': 'Nuevo',
            'primer_apellido': 'Usuario',
            'ci': '12345678'
        },
        content_type='application/json'
    )
    
    assert response.status_code == 201
    data = response.get_json()
    assert 'access_token' in data
    assert data['user']['username'] == 'newuser'


def test_api_register_duplicate(client, user_factory):
    """Test API register with existing username"""
    user_factory(username='existing', email='existing@test.com')
    
    response = client.post('/api/auth/register',
        json={
            'username': 'existing',
            'email': 'other@test.com',
            'password': 'Pass123',
            'primer_nombre': 'Test',
            'primer_apellido': 'User'
        },
        content_type='application/json'
    )
    
    assert response.status_code == 409
    data = response.get_json()
    assert 'error' in data


def test_api_profile_requires_auth(client):
    """Test API profile endpoint requires JWT"""
    response = client.get('/api/auth/profile')
    assert response.status_code == 401


def test_api_profile_with_auth(client, user_factory):
    """Test API profile returns user data with JWT"""
    user = user_factory(username='testuser', email='test@test.com', password='TestPass123')
    
    # Login first to get token
    login_response = client.post('/api/auth/login',
        json={'username': 'testuser', 'password': 'TestPass123'},
        content_type='application/json'
    )
    token = login_response.get_json()['access_token']
    
    # Access profile with token
    response = client.get('/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'user' in data
    assert data['user']['username'] == 'testuser'


def test_api_secciones_requires_auth(client):
    """Test API secciones endpoint requires JWT"""
    response = client.get('/api/secciones')
    assert response.status_code == 401


def test_api_secciones_empty(client, user_factory):
    """Test API secciones returns empty list for new user"""
    user = user_factory(username='testuser', email='test@test.com', password='TestPass123')
    
    # Login first
    login_response = client.post('/api/auth/login',
        json={'username': 'testuser', 'password': 'TestPass123'},
        content_type='application/json'
    )
    token = login_response.get_json()['access_token']
    
    # Get secciones
    response = client.get('/api/secciones',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'secciones' in data
    assert isinstance(data['secciones'], list)


def test_api_asistencia_historial_requires_auth(client):
    """Test API asistencia historial requires JWT"""
    response = client.get('/api/asistencia/historial')
    assert response.status_code == 401


def test_api_justificativos_requires_auth(client):
    """Test API justificativos requires JWT"""
    response = client.get('/api/justificativos')
    assert response.status_code == 401


def test_api_sync_requires_auth(client):
    """Test API sync requires JWT"""
    response = client.post('/api/sync', json={})
    assert response.status_code == 401


def test_api_invalid_token(client):
    """Test API with invalid token"""
    response = client.get('/api/secciones',
        headers={'Authorization': 'Bearer invalid_token_here'}
    )
    assert response.status_code in [401, 422]


def test_api_login_with_email(client, user_factory):
    """Test API login also works with email"""
    user = user_factory(username='testuser', email='test@test.com', password='TestPass123')
    
    # Try login with email instead of username
    response = client.post('/api/auth/login', 
        json={'username': 'test@test.com', 'password': 'TestPass123'},
        content_type='application/json'
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data


def test_api_change_password(client, user_factory):
    """Test API change password"""
    user = user_factory(username='testuser', email='test@test.com', password='OldPass123')
    
    # Login first
    login_response = client.post('/api/auth/login',
        json={'username': 'testuser', 'password': 'OldPass123'},
        content_type='application/json'
    )
    token = login_response.get_json()['access_token']
    
    # Change password
    response = client.post('/api/auth/change-password',
        json={'current_password': 'OldPass123', 'new_password': 'NewPass456'},
        headers={'Authorization': f'Bearer {token}'},
        content_type='application/json'
    )
    
    assert response.status_code == 200
    
    # Verify new password works
    login_response2 = client.post('/api/auth/login',
        json={'username': 'testuser', 'password': 'NewPass456'},
        content_type='application/json'
    )
    assert login_response2.status_code == 200


def test_api_update_profile(client, user_factory):
    """Test API update profile"""
    user = user_factory(username='testuser', email='test@test.com', password='TestPass123')
    
    # Login first
    login_response = client.post('/api/auth/login',
        json={'username': 'testuser', 'password': 'TestPass123'},
        content_type='application/json'
    )
    token = login_response.get_json()['access_token']
    
    # Update profile
    response = client.put('/api/auth/profile',
        json={'telefono': '1234567890', 'ci': '98765432'},
        headers={'Authorization': f'Bearer {token}'},
        content_type='application/json'
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['user']['telefono'] == '1234567890'