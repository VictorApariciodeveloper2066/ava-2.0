import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL no configurada")
    exit(1)

if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

engine = create_engine(DATABASE_URL)

tables = ['user', 'course', 'user_course', 'asistencia', 'justificativo', 'historial_asistencia', 'detalle_asistencia', 'log_asistencia']

with engine.connect() as conn:
    for table in tables:
        try:
            # Get max ID and set sequence
            result = conn.execute(text(f"SELECT COALESCE((SELECT MAX(id) FROM {table}), 0) + 1 as next_id"))
            next_id = result.scalar()
            conn.execute(text(f"ALTER SEQUENCE {table}_id_seq RESTART WITH {next_id}"))
            conn.commit()
            print(f"✓ {table}: secuencia reseteada a {next_id}")
        except Exception as e:
            print(f"✗ Error en {table}: {e}")

print("\n✅ Secuencias sincronizadas")
