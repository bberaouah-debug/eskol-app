from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User, RoleEnum
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import hash_password

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación no permitida"
        )
    return current_user

@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    return db.query(User).all()

@router.post("/", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    # Check if username or email already exists
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="El email ya existe")
    
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        active=user_in.active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = user_in.dict(exclude_unset=True)
    if "password" in update_data:
        db_user.hashed_password = hash_password(update_data["password"])
        del update_data["password"]
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", response_model=UserResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Soft delete: just deactivate
    db_user.active = False
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
