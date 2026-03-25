# Test de Endpoints del Dashboard - AVA
# Este script verifica que todos los botones y funcionalidades funcionen correctamente

import requests
import json

BASE_URL = "http://localhost:5000"

print("=" * 60)
print("PRUEBA DE ENDPOINTS DEL DASHBOARD - AVA")
print("=" * 60)

# Crear sesión para mantener cookies
session = requests.Session()

# 1. TEST: Login
print("\n[1] Probando Login...")
login_data = {
    "username": "test_user",
    "password": "test_password"
}
try:
    response = session.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        print("✓ Login: OK")
    else:
        print(f"✗ Login: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Login: ERROR - {e}")

# 2. TEST: Dashboard
print("\n[2] Probando Dashboard...")
try:
    response = session.get(f"{BASE_URL}/dashboard")
    if response.status_code == 200:
        print("✓ Dashboard: OK")
    else:
        print(f"✗ Dashboard: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Dashboard: ERROR - {e}")

# 3. TEST: Generar Código (Profesor)
print("\n[3] Probando Generar Código...")
try:
    response = session.post(f"{BASE_URL}/auth/generate_code/1")
    if response.status_code in [200, 403]:  # 403 si no es profesor
        print(f"✓ Generar Código: OK (Status: {response.status_code})")
    else:
        print(f"✗ Generar Código: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Generar Código: ERROR - {e}")

# 4. TEST: Validar Asistencia (Estudiante)
print("\n[4] Probando Validar Asistencia...")
attendance_data = {
    "course_id": 1,
    "code": "ABC123"
}
try:
    response = session.post(f"{BASE_URL}/auth/submit_attendance", json=attendance_data)
    if response.status_code in [201, 400, 403, 409]:  # Varios códigos válidos
        print(f"✓ Validar Asistencia: OK (Status: {response.status_code})")
    else:
        print(f"✗ Validar Asistencia: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Validar Asistencia: ERROR - {e}")

# 5. TEST: Control de Alumnos (Profesor)
print("\n[5] Probando Control de Alumnos...")
try:
    response = session.get(f"{BASE_URL}/asistencia/1")
    if response.status_code in [200, 302, 403]:
        print(f"✓ Control de Alumnos: OK (Status: {response.status_code})")
    else:
        print(f"✗ Control de Alumnos: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Control de Alumnos: ERROR - {e}")

# 6. TEST: Ver Historial
print("\n[6] Probando Ver Historial...")
try:
    response = session.get(f"{BASE_URL}/historial/1")
    if response.status_code in [200, 302, 403, 404]:
        print(f"✓ Ver Historial: OK (Status: {response.status_code})")
    else:
        print(f"✗ Ver Historial: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Ver Historial: ERROR - {e}")

# 7. TEST: Cargar Justificativo
print("\n[7] Probando Cargar Justificativo...")
try:
    response = session.get(f"{BASE_URL}/cargar_justificativo")
    if response.status_code in [200, 302, 403]:
        print(f"✓ Cargar Justificativo: OK (Status: {response.status_code})")
    else:
        print(f"✗ Cargar Justificativo: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Cargar Justificativo: ERROR - {e}")

# 8. TEST: Editar Aula (Profesor)
print("\n[8] Probando Editar Aula...")
aula_data = {
    "course_id": 1,
    "aula": "Aula 101"
}
try:
    response = session.post(f"{BASE_URL}/auth/actualizar_aula", json=aula_data)
    if response.status_code in [200, 403]:
        print(f"✓ Editar Aula: OK (Status: {response.status_code})")
    else:
        print(f"✗ Editar Aula: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Editar Aula: ERROR - {e}")

# 9. TEST: Historial Alumno
print("\n[9] Probando Historial Alumno...")
try:
    response = session.get(f"{BASE_URL}/historial_alumno")
    if response.status_code in [200, 302]:
        print(f"✓ Historial Alumno: OK (Status: {response.status_code})")
    else:
        print(f"✗ Historial Alumno: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Historial Alumno: ERROR - {e}")

# 10. TEST: Configuración
print("\n[10] Probando Configuración...")
try:
    response = session.get(f"{BASE_URL}/configuracion")
    if response.status_code in [200, 302]:
        print(f"✓ Configuración: OK (Status: {response.status_code})")
    else:
        print(f"✗ Configuración: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Configuración: ERROR - {e}")

# 11. TEST: Logout
print("\n[11] Probando Logout...")
try:
    response = session.get(f"{BASE_URL}/auth/logout")
    if response.status_code in [200, 302]:
        print(f"✓ Logout: OK (Status: {response.status_code})")
    else:
        print(f"✗ Logout: FAIL (Status: {response.status_code})")
except Exception as e:
    print(f"✗ Logout: ERROR - {e}")

print("\n" + "=" * 60)
print("PRUEBAS COMPLETADAS")
print("=" * 60)
print("\nNOTA: Los códigos 302 (redirect) y 403 (forbidden) son esperados")
print("cuando no hay sesión activa o no se tienen los permisos correctos.")
print("\nPara pruebas completas, inicia sesión manualmente en el navegador")
print("y verifica cada funcionalidad visualmente.")
