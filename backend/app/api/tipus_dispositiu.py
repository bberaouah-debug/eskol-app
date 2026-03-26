from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User, RoleEnum
from app.schemas.tipus_dispositiu import TipusDispositiuCreate, TipusDispositiuUpdate, TipusDispositiuResponse
from app.crud import tipus_dispositiu as crud_tipus

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="No tienes permisos suficientes")
    return current_user

@router.get("/", response_model=List[TipusDispositiuResponse])
def list_tipus(db: Session = Depends(get_db)):
    return crud_tipus.get_all_tipus(db)

@router.post("/", response_model=TipusDispositiuResponse)
def create_tipus(
    tipus_in: TipusDispositiuCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    return crud_tipus.create_tipus(db, tipus_in)

@router.put("/{tipus_id}", response_model=TipusDispositiuResponse)
def update_tipus(
    tipus_id: int,
    tipus_in: TipusDispositiuUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    db_tipus = crud_tipus.get_tipus_by_id(db, tipus_id)
    if not db_tipus:
        raise HTTPException(status_code=404, detail="Tipo no encontrado")
    return crud_tipus.update_tipus(db, db_tipus, tipus_in)

@router.delete("/{tipus_id}", response_model=TipusDispositiuResponse)
def delete_tipus(
    tipus_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    db_tipus = crud_tipus.get_tipus_by_id(db, tipus_id)
    if not db_tipus:
        raise HTTPException(status_code=404, detail="Tipo no encontrado")
    return crud_tipus.delete_tipus(db, db_tipus)
