from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class TipusDispositiu(Base):
    __tablename__ = "tipus_dispositiu"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String(100), nullable=False)
    prefix = Column(String(10), nullable=False)
    icona = Column(String(50), default="📦")
    actiu = Column(Boolean, default=True)
