from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class CategoriaEnum(str, enum.Enum):
    Ordenador = "Ordenador"
    Portatil = "Portatil"
    Impresora = "Impresora"
    Disco_Duro = "Disco_Duro"
    Periferico = "Periferico"
    Monitor = "Monitor"
    Cable = "Cable"
    Otro = "Otro"

class EstadoEnum(str, enum.Enum):
    disponible = "disponible"
    en_uso = "en_uso"
    en_reparacion = "en_reparacion"
    de_baja = "de_baja"
    reservado = "reservado"

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    codigo_barras = Column(String(50), unique=True, index=True, nullable=True)
    numero_serie = Column(String(100), nullable=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    categoria = Column(Enum(CategoriaEnum), default=CategoriaEnum.Otro, nullable=False)
    estado = Column(Enum(EstadoEnum), default=EstadoEnum.disponible, nullable=False)
    
    espacio_id = Column(Integer, ForeignKey("espacios.id"), nullable=True)
    espacio = relationship("Espacio", back_populates="items")
    
    creado_por_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    creado_por = relationship("User")
    
    fecha_alta = Column(DateTime(timezone=True), server_default=func.now())
    fecha_modificacion = Column(DateTime(timezone=True), onupdate=func.now())
    activo = Column(Boolean, default=True)
