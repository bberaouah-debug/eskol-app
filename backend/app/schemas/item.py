from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.item import CategoriaEnum, EstadoEnum
from app.schemas.espacio import EspacioResponse

class ItemBase(BaseModel):
    codigo_barras: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    categoria: CategoriaEnum = CategoriaEnum.Otro
    estado: EstadoEnum = EstadoEnum.disponible
    espacio_id: Optional[int] = None
    activo: bool = True

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    codigo_barras: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[CategoriaEnum] = None
    estado: Optional[EstadoEnum] = None
    espacio_id: Optional[int] = None
    activo: Optional[bool] = None

class ItemResponse(ItemBase):
    id: int
    creado_por_id: int
    fecha_alta: datetime
    fecha_modificacion: Optional[datetime] = None
    espacio: Optional[EspacioResponse] = None

    class Config:
        from_attributes = True
