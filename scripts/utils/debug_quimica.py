import sqlite3
from datetime import datetime

# Conectar a la base de datos
db_path = 'instance/users.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Obtener información de la materia de Química
cursor.execute("SELECT id, name, dia, start_time, end_time, aula FROM course WHERE name LIKE '%uímica%' OR name LIKE '%Quimica%'")
quimica = cursor.fetchall()

print("=== INFORMACIÓN DE QUÍMICA ===")
if quimica:
    for curso in quimica:
        print(f"\nID: {curso[0]}")
        print(f"Nombre: {curso[1]}")
        print(f"Día: {curso[2]} (1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes)")
        print(f"Hora inicio: {curso[3]}")
        print(f"Hora fin: {curso[4]}")
        print(f"Aula: {curso[5]}")
else:
    print("No se encontró la materia de Química")

# Verificar día y hora actual
now = datetime.now()
print(f"\n=== HORA ACTUAL ===")
print(f"Día de la semana: {now.weekday() + 1} (1=Lunes, 7=Domingo)")
print(f"Hora actual: {now.strftime('%H:%M:%S')}")
print(f"Fecha: {now.strftime('%Y-%m-%d')}")

# Listar todas las materias
print("\n=== TODAS LAS MATERIAS ===")
cursor.execute("SELECT id, name, dia, start_time, end_time FROM course")
all_courses = cursor.fetchall()
for curso in all_courses:
    print(f"{curso[0]}: {curso[1]} - Día {curso[2]} - {curso[3]} a {curso[4]}")

conn.close()
