from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User, RoleEnum
from app.models.item import EstadoEnum
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.crud import item as crud_item

router = APIRouter()

def get_privileged_user(current_user: User = Depends(get_current_user)):
    if current_user.role not in [RoleEnum.admin, RoleEnum.tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos suficientes")
    return current_user

def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="No tienes permisos suficientes")
    return current_user

@router.get("/", response_model=List[ItemResponse])
def list_items(
    db: Session = Depends(get_db),
    estado: Optional[EstadoEnum] = Query(None),
    buscar: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    return crud_item.get_items(db, skip=skip, limit=limit, estado=estado, buscar=buscar)

@router.get("/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = crud_item.get_item(db, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return db_item

@router.get("/barcode/{codigo}", response_model=ItemResponse)
def get_item_by_barcode(
    codigo: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = crud_item.get_item_by_barcode(db, codigo)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return db_item

@router.post("/", response_model=ItemResponse)
def create_item(
    item_in: ItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_privileged_user)
):
    if item_in.codigo_barras:
        db_item = crud_item.get_item_by_barcode(db, item_in.codigo_barras)
        if db_item:
            raise HTTPException(status_code=400, detail="Este código de barras ya existe")
    return crud_item.create_item(db, item_in, user.id)

@router.put("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    item_in: ItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_privileged_user)
):
    db_item = crud_item.get_item(db, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return crud_item.update_item(db, db_item, item_in)

@router.delete("/{item_id}", response_model=ItemResponse)
def deactivate_item(
    item_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    db_item = crud_item.get_item(db, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return crud_item.deactivate_item(db, db_item)
