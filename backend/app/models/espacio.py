from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Espacio(Base):
    __tablename__ = "espacios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), unique=True, index=True, nullable=False)
    descripcion = Column(String(255), nullable=True)
    activo = Column(Boolean, default=True)

    items = relationship("Item", back_populates="espacio")
