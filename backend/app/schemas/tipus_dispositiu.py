from pydantic import BaseModel
from typing import Optional

class TipusDispositiuBase(BaseModel):
    nom: str
    prefix: str
    icona: str = "📦"
    actiu: bool = True

class TipusDispositiuCreate(TipusDispositiuBase):
    pass

class TipusDispositiuUpdate(BaseModel):
    nom: Optional[str] = None
    prefix: Optional[str] = None
    icona: Optional[str] = None
    actiu: Optional[bool] = None

class TipusDispositiuResponse(TipusDispositiuBase):
    id: int

    class Config:
        from_attributes = True
