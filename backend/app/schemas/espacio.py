from pydantic import BaseModel
from typing import Optional

class EspacioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True

class EspacioCreate(EspacioBase):
    pass

class EspacioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

class EspacioResponse(EspacioBase):
    id: int

    class Config:
        from_attributes = True
