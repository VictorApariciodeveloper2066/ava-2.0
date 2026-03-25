import sqlite3

# Conectar a la base de datos
db_path = 'instance/users.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Cambiar el nombre de Química a Programación
cursor.execute("UPDATE course SET name = 'Programación' WHERE id = 4")

# Confirmar cambios
conn.commit()

# Verificar el cambio
cursor.execute("SELECT id, name, dia, start_time, end_time FROM course WHERE id = 4")
result = cursor.fetchone()

print("=== CAMBIO REALIZADO ===")
print(f"ID: {result[0]}")
print(f"Nuevo nombre: {result[1]}")
print(f"Día: {result[2]}")
print(f"Horario: {result[3]} - {result[4]}")

conn.close()
print("\n✓ Materia actualizada exitosamente")
