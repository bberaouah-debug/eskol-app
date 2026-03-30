from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.item import EstadoEnum
from app.schemas.espacio import EspacioResponse
from app.schemas.tipus_dispositiu import TipusDispositiuResponse

class ItemBase(BaseModel):
    codigo_barras: Optional[str] = None
    numero_serie: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    tipus_id: Optional[int] = None
    estado: EstadoEnum = EstadoEnum.disponible
    espacio_id: Optional[int] = None
    activo: bool = True

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    codigo_barras: Optional[str] = None
    numero_serie: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipus_id: Optional[int] = None
    estado: Optional[EstadoEnum] = None
    espacio_id: Optional[int] = None
    activo: Optional[bool] = None

class ItemResponse(ItemBase):
    id: int
    creado_por_id: int
    fecha_alta: datetime
    fecha_modificacion: Optional[datetime] = None
    espacio: Optional[EspacioResponse] = None
    tipus: Optional[TipusDispositiuResponse] = None

    class Config:
        from_attributes = True
