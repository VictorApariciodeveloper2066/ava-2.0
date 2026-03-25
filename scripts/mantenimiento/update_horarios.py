import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL no configurada")
    exit(1)

if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

engine = create_engine(DATABASE_URL)

# Actualizar horarios: 4 AM a 8 PM
updates = [
    ("UPDATE course SET start_time = '04:00:00', end_time = '08:00:00' WHERE name = 'Inglés'", "Inglés: 04:00-08:00"),
    ("UPDATE course SET start_time = '08:00:00', end_time = '12:00:00' WHERE name = 'Matemáticas'", "Matemáticas: 08:00-12:00"),
    ("UPDATE course SET start_time = '12:00:00', end_time = '16:00:00' WHERE name = 'Historia'", "Historia: 12:00-16:00"),
    ("UPDATE course SET start_time = '16:00:00', end_time = '20:00:00' WHERE name = 'Programación'", "Programación: 16:00-20:00"),
    ("UPDATE course SET start_time = '04:00:00', end_time = '08:00:00' WHERE name = 'Educación Física'", "Educación Física: 04:00-08:00"),
]

with engine.connect() as conn:
    for query, desc in updates:
        try:
            conn.execute(text(query))
            print(f"✓ {desc}")
        except Exception as e:
            print(f"✗ Error en {desc}: {e}")
    conn.commit()

print("\n✅ Horarios actualizados (4 AM - 8 PM)")
