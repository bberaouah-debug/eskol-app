from sqlalchemy.orm import Session
from app.models.user import User, RoleEnum
from app.models.espacio import Espacio
from app.models.item import Item, CategoriaEnum, EstadoEnum
from app.core.security import hash_password
from app.core.config import settings
from app.core.database import SessionLocal

def create_initial_data():
    db = SessionLocal()
    try:
        # 1. Admin
        admin = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
        if not admin:
            hashed_pwd = hash_password(settings.ADMIN_PASSWORD)
            admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                hashed_password=hashed_pwd,
                role=RoleEnum.admin,
                active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"Admin creado exitosamente: {settings.ADMIN_USERNAME}")
        else:
            print("Admin ya existe.")

        # 2. Espacios
        taller = db.query(Espacio).filter(Espacio.nombre == "Taller Informático").first()
        if not taller:
            taller = Espacio(nombre="Taller Informático", descripcion="Espacio principal de reparaciones")
            db.add(taller)
        
        biblio = db.query(Espacio).filter(Espacio.nombre == "Biblioteca").first()
        if not biblio:
            biblio = Espacio(nombre="Biblioteca", descripcion="Sala de estudio y consulta")
            db.add(biblio)
        
        db.commit()
        db.refresh(taller)
        print("Espacios iniciales creados.")

        # 3. Items (5 items en Taller Informático)
        items_count = db.query(Item).count()
        if items_count == 0:
            sample_items = [
                Item(
                    nombre="PC Sobremesa Dell 01", 
                    codigo_barras="DELL001", 
                    categoria=CategoriaEnum.Ordenador,
                    estado=EstadoEnum.disponible,
                    espacio_id=taller.id,
                    creado_por_id=admin.id
                ),
                Item(
                    nombre="Portátil HP ProBook", 
                    codigo_barras="HP001", 
                    categoria=CategoriaEnum.Portatil,
                    estado=EstadoEnum.en_uso,
                    espacio_id=taller.id,
                    creado_por_id=admin.id
                ),
                Item(
                    nombre="Monitor LG 24''", 
                    codigo_barras="LG24-01", 
                    categoria=CategoriaEnum.Monitor,
                    estado=EstadoEnum.disponible,
                    espacio_id=taller.id,
                    creado_por_id=admin.id
                ),
                Item(
                    nombre="Impresora Brother MFC", 
                    codigo_barras="BRO-01", 
                    categoria=CategoriaEnum.Impresora,
                    estado=EstadoEnum.en_reparacion,
                    espacio_id=taller.id,
                    creado_por_id=admin.id
                ),
                Item(
                    nombre="Disco Duro Externo 1TB", 
                    codigo_barras="HDD1TB-01", 
                    categoria=CategoriaEnum.Disco_Duro,
                    estado=EstadoEnum.disponible,
                    espacio_id=taller.id,
                    creado_por_id=admin.id
                ),
            ]
            db.add_all(sample_items)
            db.commit()
            print("Items de prueba creados.")
        else:
            print("Ya existen items en la base de datos.")

    finally:
        db.close()
