from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.models.item import Item, EstadoEnum
from app.models.tipus_dispositiu import TipusDispositiu
from app.schemas.item import ItemCreate, ItemUpdate

def get_item(db: Session, item_id: int):
    return db.query(Item).filter(Item.id == item_id).first()

def get_item_by_barcode(db: Session, barcode: str):
    return db.query(Item).filter(Item.codigo_barras == barcode).first()

def get_items(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    estado: Optional[EstadoEnum] = None,
    buscar: Optional[str] = None
):
    query = db.query(Item)
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
    item_data = item.dict()
    
    # Generación automática de código de barras si viene vacío
    if not item_data.get("codigo_barras") and item_data.get("tipus_id"):
        # Obtener el prefijo dinámico del tipo de dispositivo
        tipus = db.query(TipusDispositiu).filter(TipusDispositiu.id == item_data["tipus_id"]).first()
        prefix = tipus.prefix if tipus else "OTR"
        
        # Buscar el último ítem de este tipo que tenga el prefijo
        last_item = db.query(Item).filter(
            Item.tipus_id == item_data["tipus_id"],
            Item.codigo_barras.like(f"{prefix}-%")
        ).order_by(Item.codigo_barras.desc()).first()
        
        next_num = 1
        if last_item and last_item.codigo_barras:
            try:
                # Extraer el número del final (ej: LPT-00042 -> 42)
                last_num_str = last_item.codigo_barras.split('-')[-1]
                next_num = int(last_num_str) + 1
            except (ValueError, IndexError):
                next_num = 1
        
        # Formatear con ceros a la izquierda (5 dígitos)
        item_data["codigo_barras"] = f"{prefix}-{next_num:05d}"

    db_item = Item(**item_data, creado_por_id=user_id)
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
