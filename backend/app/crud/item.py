from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.models.item import Item, CategoriaEnum, EstadoEnum
from app.schemas.item import ItemCreate, ItemUpdate

def get_item(db: Session, item_id: int):
    return db.query(Item).filter(Item.id == item_id).first()

def get_item_by_barcode(db: Session, barcode: str):
    return db.query(Item).filter(Item.codigo_barras == barcode).first()

def get_items(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    categoria: Optional[CategoriaEnum] = None,
    estado: Optional[EstadoEnum] = None,
    buscar: Optional[str] = None
):
    query = db.query(Item)
    if categoria:
        query = query.filter(Item.categoria == categoria)
    if estado:
        query = query.filter(Item.estado == estado)
    if buscar:
        search_filter = or_(
            Item.nombre.ilike(f"%{buscar}%"),
            Item.codigo_barras.ilike(f"%{buscar}%")
        )
        query = query.filter(search_filter)
    
    return query.offset(skip).limit(limit).all()

def create_item(db: Session, item: ItemCreate, user_id: int):
    db_item = Item(**item.dict(), creado_por_id=user_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_item(db: Session, db_item: Item, item_in: ItemUpdate):
    update_data = item_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_item, field, update_data[field])
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def deactivate_item(db: Session, db_item: Item):
    db_item.activo = False
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
