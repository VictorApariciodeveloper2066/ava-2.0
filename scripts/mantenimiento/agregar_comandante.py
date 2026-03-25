from backend.extensions import db
from backend.models import User
from app import create_app
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE user ADD COLUMN es_comandante BOOLEAN DEFAULT 0"))
            conn.commit()
        print("Columna 'es_comandante' agregada exitosamente")
    except Exception as e:
        if "duplicate column" in str(e).lower():
            print("Columna 'es_comandante' ya existe")
        else:
            print(f"Error: {e}")
    
    print("Base de datos actualizada correctamente")
