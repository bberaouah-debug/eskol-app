from sqlalchemy.orm import Session
from app.models.user import User, RoleEnum
from app.core.security import hash_password
from app.core.config import settings
from app.core.database import SessionLocal

def create_default_admin():
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.role == RoleEnum.admin).first()
        if not admin_exists:
            hashed_pwd = hash_password(settings.ADMIN_PASSWORD)
            new_admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                hashed_password=hashed_pwd,
                role=RoleEnum.admin,
                active=True
            )
            db.add(new_admin)
            db.commit()
            print(f"Admin creado exitosamente: {settings.ADMIN_USERNAME}")
        else:
            print("Admin ya existe en la base de datos.")
    finally:
        db.close()
