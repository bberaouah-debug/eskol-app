from sqlalchemy.orm import Session
from app.models.espacio import Espacio
from app.schemas.espacio import EspacioCreate, EspacioUpdate

def get_espacio(db: Session, espacio_id: int):
    return db.query(Espacio).filter(Espacio.id == espacio_id).first()

def get_espacio_by_nombre(db: Session, nombre: str):
    return db.query(Espacio).filter(Espacio.nombre == nombre).first()

def get_espacios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Espacio).offset(skip).limit(limit).all()

def create_espacio(db: Session, espacio: EspacioCreate):
    db_espacio = Espacio(**espacio.dict())
    db.add(db_espacio)
    db.commit()
    db.refresh(db_espacio)
    return db_espacio

def update_espacio(db: Session, db_espacio: Espacio, espacio_in: EspacioUpdate):
    update_data = espacio_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_espacio, field, update_data[field])
    db.add(db_espacio)
    db.commit()
    db.refresh(db_espacio)
    return db_espacio
