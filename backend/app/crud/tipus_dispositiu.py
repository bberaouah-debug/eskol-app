from sqlalchemy.orm import Session
from app.models.tipus_dispositiu import TipusDispositiu
from app.schemas.tipus_dispositiu import TipusDispositiuCreate, TipusDispositiuUpdate

def get_tipus_by_id(db: Session, tipus_id: int):
    return db.query(TipusDispositiu).filter(TipusDispositiu.id == tipus_id).first()

def get_all_tipus(db: Session, skip: int = 0, limit: int = 100):
    return db.query(TipusDispositiu).offset(skip).limit(limit).all()

def create_tipus(db: Session, tipus_in: TipusDispositiuCreate):
    db_tipus = TipusDispositiu(**tipus_in.dict())
    db.add(db_tipus)
    db.commit()
    db.refresh(db_tipus)
    return db_tipus

def update_tipus(db: Session, db_tipus: TipusDispositiu, tipus_in: TipusDispositiuUpdate):
    update_data = tipus_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_tipus, field, update_data[field])
    db.add(db_tipus)
    db.commit()
    db.refresh(db_tipus)
    return db_tipus

def delete_tipus(db: Session, db_tipus: TipusDispositiu):
    db_tipus.actiu = False
    db.add(db_tipus)
    db.commit()
    db.refresh(db_tipus)
    return db_tipus
