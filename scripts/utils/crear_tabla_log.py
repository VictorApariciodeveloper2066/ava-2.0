from backend.extensions import db
from app import create_app
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        with db.engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS log_asistencia (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    course_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    modificado_por INTEGER NOT NULL,
                    accion VARCHAR(100) NOT NULL,
                    estado_anterior VARCHAR(20),
                    estado_nuevo VARCHAR(20) NOT NULL,
                    fecha DATE NOT NULL,
                    hora TIME NOT NULL,
                    FOREIGN KEY (course_id) REFERENCES course(id),
                    FOREIGN KEY (user_id) REFERENCES user(id),
                    FOREIGN KEY (modificado_por) REFERENCES user(id)
                )
            """))
            conn.commit()
        print("Tabla 'log_asistencia' creada exitosamente")
    except Exception as e:
        print(f"Error: {e}")
