from sqlalchemy.orm import Session
from app.models.user import User, RoleEnum
from app.models.espacio import Espacio
from app.models.item import Item, EstadoEnum
from app.models.tipus_dispositiu import TipusDispositiu
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

        # 2. Tipus de Dispositiu
        tipus_data = [
            {"nom": "Ordinador", "prefix": "PC", "icona": "🖥️"},
            {"nom": "Portàtil", "prefix": "LPT", "icona": "💻"},
            {"nom": "Impressora", "prefix": "IMP", "icona": "🖨️"},
            {"nom": "Disc Dur", "prefix": "DSC", "icona": "💾"},
            {"nom": "Perifèric", "prefix": "PRF", "icona": "⌨️"},
            {"nom": "Monitor", "prefix": "MON", "icona": "📺"},
            {"nom": "Cable", "prefix": "CBL", "icona": "🔌"},
            {"nom": "Altre", "prefix": "OTR", "icona": "📦"},
        ]
        
        for t in tipus_data:
            exists = db.query(TipusDispositiu).filter(TipusDispositiu.nom == t["nom"]).first()
            if not exists:
                db.add(TipusDispositiu(**t))
        db.commit()
        print("Tipus de dispositiu inicials creats.")

        # 3. Espacios
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

        # 4. Items (5 items en Taller Informático)
        items_count = db.query(Item).count()
        if items_count == 0:
            pc_type = db.query(TipusDispositiu).filter(TipusDispositiu.nom == "Ordinador").first()
            lpt_type = db.query(TipusDispositiu).filter(TipusDispositiu.nom == "Portàtil").first()
            mon_type = db.query(TipusDispositiu).filter(TipusDispositiu.nom == "Monitor").first()
            imp_type = db.query(TipusDispositiu).filter(TipusDispositiu.nom == "Impressora").first()
            dsc_type = db.query(TipusDispositiu).filter(TipusDispositiu.nom == "Disc Dur").first()

            sample_items = [
                Item(
                    nombre="PC Sobremesa Dell 01", 
                    codigo_barras="PC-00001", 
                    tipus_id=pc_type.id if pc_type else None,
                    estado=EstadoEnum.disponible,
                    espacio_id=taller.id,
                    creado_por_id=admin.id
                ),
                Item(
                    nombre="Portátil HP ProBook", 
                    codigo_barras="LPT-00001", 
                    tipus_id=lpt_type.id if lpt_type else None,
                    estado=EstadoEnum.en_uso,
                    espacio_id=taller.id,
                    creado_por_id=admin.id
                ),
                Item(
                    nombre="Monitor LG 24''", 
                    codigo_barras="MON-00001", 
                    tipus_id=mon_type.id if mon_type else None,
                    estado=EstadoEnum.disponible,
                    espacio_id=taller.id,
                    creado_por_id=admin.id
                ),
                Item(
                    nombre="Impresora Brother MFC", 
                    codigo_barras="IMP-00001", 
                    tipus_id=imp_type.id if imp_type else None,
                    estado=EstadoEnum.en_reparacion,
                    espacio_id=taller.id,
                    creado_por_id=admin.id
                ),
                Item(
                    nombre="Disco Duro Externo 1TB", 
                    codigo_barras="DSC-00001", 
                    tipus_id=dsc_type.id if dsc_type else None,
                    estado=EstadoEnum.disponible,
                    espacio_id=taller.id,
                    creado_por_id=admin.id
                ),
            ]
            db.add_all(sample_items)
            db.commit()
            print("Items de prueba creados.")

    finally:
        db.close()
