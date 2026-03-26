from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User, RoleEnum
from app.schemas.espacio import EspacioCreate, EspacioUpdate, EspacioResponse
from app.crud import espacio as crud_espacio

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="No tienes permisos suficientes")
    return current_user

@router.get("/", response_model=List[EspacioResponse])
def list_espacios(db: Session = Depends(get_db)):
    return crud_espacio.get_espacios(db)

@router.post("/", response_model=EspacioResponse)
def create_espacio(
    espacio_in: EspacioCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    db_espacio = crud_espacio.get_espacio_by_nombre(db, nombre=espacio_in.nombre)
    if db_espacio:
        raise HTTPException(status_code=400, detail="Este espacio ya existe")
    return crud_espacio.create_espacio(db, espacio_in)

@router.put("/{espacio_id}", response_model=EspacioResponse)
def update_espacio(
    espacio_id: int,
    espacio_in: EspacioUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    db_espacio = crud_espacio.get_espacio(db, espacio_id)
    if not db_espacio:
        raise HTTPException(status_code=404, detail="Espacio no encontrado")
    return crud_espacio.update_espacio(db, db_espacio, espacio_in)
