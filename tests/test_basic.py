def test_app_exists(client):
    """Test that the application exists."""
    assert client is not None

def test_404_error(client):
    """Test 404 error handling."""
    response = client.get('/nonexistentendpoint')
    assert response.status_code == 404

def test_static_route(client):
    """Test that static route exists (even if file doesn't)."""
    response = client.get('/static/nonexistent.css')
    # Should not crash with 500
    assert response.status_code != 500

if __name__ == '__main__':
    import pytest
    pytest.main([__file__])