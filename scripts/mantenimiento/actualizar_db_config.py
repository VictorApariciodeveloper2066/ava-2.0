import sqlite3
import os

# Ruta a la base de datos
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'users.db')

# Conectar a la base de datos
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Verificar si las columnas ya existen
    cursor.execute("PRAGMA table_info(user)")
    columns = [column[1] for column in cursor.fetchall()]
    
    # Agregar avatar_url si no existe
    if 'avatar_url' not in columns:
        cursor.execute("ALTER TABLE user ADD COLUMN avatar_url VARCHAR(255)")
        print("[OK] Columna 'avatar_url' agregada")
    else:
        print("[OK] Columna 'avatar_url' ya existe")
    
    # Agregar notificaciones_activas si no existe
    if 'notificaciones_activas' not in columns:
        cursor.execute("ALTER TABLE user ADD COLUMN notificaciones_activas BOOLEAN DEFAULT 1")
        print("[OK] Columna 'notificaciones_activas' agregada")
    else:
        print("[OK] Columna 'notificaciones_activas' ya existe")
    
    # Agregar formato_hora si no existe
    if 'formato_hora' not in columns:
        cursor.execute("ALTER TABLE user ADD COLUMN formato_hora VARCHAR(10) DEFAULT '12h'")
        print("[OK] Columna 'formato_hora' agregada")
    else:
        print("[OK] Columna 'formato_hora' ya existe")
    
    # Crear directorio para avatares
    avatars_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'static', 'uploads', 'avatars')
    os.makedirs(avatars_dir, exist_ok=True)
    print("[OK] Directorio de avatares creado")
    
    conn.commit()
    print("\n[EXITO] Base de datos actualizada exitosamente")
    
except Exception as e:
    print(f"\n[ERROR] {e}")
    conn.rollback()
finally:
    conn.close()
