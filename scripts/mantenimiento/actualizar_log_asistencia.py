from backend.extensions import db
from app import create_app
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Hacer user_id nullable en log_asistencia
        with db.engine.connect() as connection:
            # SQLite no soporta ALTER COLUMN directamente, necesitamos recrear la tabla
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS log_asistencia_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    course_id INTEGER NOT NULL,
                    user_id INTEGER,
                    modificado_por INTEGER NOT NULL,
                    accion VARCHAR(200) NOT NULL,
                    estado_anterior VARCHAR(20),
                    estado_nuevo VARCHAR(20),
                    fecha DATE NOT NULL,
                    hora TIME NOT NULL,
                    FOREIGN KEY (course_id) REFERENCES course(id),
                    FOREIGN KEY (user_id) REFERENCES user(id),
                    FOREIGN KEY (modificado_por) REFERENCES user(id)
                )
            """))
            
            # Copiar datos existentes
            connection.execute(text("""
                INSERT INTO log_asistencia_new 
                SELECT id, course_id, user_id, modificado_por, accion, estado_anterior, estado_nuevo, fecha, hora
                FROM log_asistencia
            """))
            
            # Eliminar tabla vieja
            connection.execute(text("DROP TABLE log_asistencia"))
            
            # Renombrar nueva tabla
            connection.execute(text("ALTER TABLE log_asistencia_new RENAME TO log_asistencia"))
            
            connection.commit()
        
        print("Tabla log_asistencia actualizada correctamente")
        print("- user_id ahora es nullable")
        print("- accion ahora soporta hasta 200 caracteres")
    except Exception as e:
        print(f"Error: {e}")
