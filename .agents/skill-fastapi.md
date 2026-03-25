# ⚙️ SKILL — Patrones FastAPI
## Convenciones del backend de Eskol

---

## Estructura de un endpoint

Todos los endpoints siguen este patrón. Nunca escribas lógica de negocio directamente en la ruta — va en `crud/`.

```python
# app/api/items.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.item import ItemCreate, ItemResponse
from app.crud import item as crud_item

router = APIRouter(prefix="/items", tags=["items"])

@router.get("/", response_model=list[ItemResponse])
def listar_items(
    buscar: str | None = None,
    categoria: str | None = None,
    estado: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud_item.get_all(db, buscar=buscar, categoria=categoria, estado=estado)
```

---

## Formato estándar de respuesta

Todas las respuestas de la API usan este formato JSON:

```json
{
  "data": { ... },
  "message": "Item creado correctamente",
  "status": "ok"
}
```

Para errores:
```json
{
  "detail": "No tienes permiso para realizar esta acción",
  "status": "error"
}
```

---

## Protección de rutas por rol

```python
from functools import wraps
from fastapi import HTTPException, status

def require_roles(*roles: str):
    """Dependency que verifica que el usuario tiene uno de los roles permitidos."""
    def dependency(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta acción"
            )
        return current_user
    return dependency

# Uso en un endpoint:
@router.post("/", response_model=ItemResponse)
def crear_item(
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("tecnico", "admin")),
):
    return crud_item.create(db, item, creado_por_id=current_user.id)
```

---

## Estructura de un CRUD

```python
# app/crud/item.py

from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate

def get_all(db: Session, buscar: str | None, categoria: str | None, estado: str | None):
    query = db.query(Item).filter(Item.activo == True)
    if buscar:
        query = query.filter(
            or_(Item.nombre.ilike(f"%{buscar}%"),
                Item.codigo_barras.ilike(f"%{buscar}%"))
        )
    if categoria:
        query = query.filter(Item.categoria == categoria)
    if estado:
        query = query.filter(Item.estado == estado)
    return query.all()

def get_by_id(db: Session, item_id: int):
    return db.query(Item).filter(Item.id == item_id, Item.activo == True).first()

def create(db: Session, data: ItemCreate, creado_por_id: int):
    item = Item(**data.model_dump(), creado_por_id=creado_por_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

def update(db: Session, item_id: int, data: ItemUpdate):
    item = get_by_id(db, item_id)
    if not item:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

def soft_delete(db: Session, item_id: int):
    item = get_by_id(db, item_id)
    if item:
        item.activo = False
        db.commit()
    return item
```

---

## Schemas Pydantic — patrón base/create/response

```python
# app/schemas/item.py

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ItemBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    categoria: str
    estado: str = "disponible"
    ubicacion: Optional[str] = None
    codigo_barras: Optional[str] = None

class ItemCreate(ItemBase):
    espacio_id: int  # A qué espacio del centro pertenece

class ItemUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[str] = None
    ubicacion: Optional[str] = None

class ItemResponse(ItemBase):
    id: int
    activo: bool
    fecha_alta: datetime
    creado_por_id: int
    espacio_id: int

    model_config = ConfigDict(from_attributes=True)
```

---

## Registrar los routers en main.py

```python
# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, users, items, espacios, incidencias
from app.core.database import Base, engine
from app.seed import create_default_admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Eskol API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(users.router, prefix="/users")
app.include_router(espacios.router, prefix="/espacios")
app.include_router(items.router, prefix="/items")
app.include_router(incidencias.router, prefix="/incidencias")

@app.on_event("startup")
async def startup():
    create_default_admin()
```

---

## Convenciones de nombrado

| Elemento | Convención | Ejemplo |
|---|---|---|
| Ficheros | snake_case | `item_foto.py` |
| Clases Python | PascalCase | `ItemResponse` |
| Variables/funciones | snake_case | `get_current_user` |
| Endpoints URL | kebab-case | `/items/{id}/fotos` |
| Campos BD | snake_case | `creado_por_id` |
| Mensajes de error | En castellano | `"No tienes permiso"` |

---

## Cómo añadir un módulo nuevo (checklist)

```
1. Crear app/models/nuevo_modelo.py
2. Crear app/schemas/nuevo_modelo.py  (Base, Create, Update, Response)
3. Crear app/crud/nuevo_modelo.py     (get_all, get_by_id, create, update, soft_delete)
4. Crear app/api/nuevo_modulo.py      (router con endpoints)
5. Registrar el router en app/main.py
6. Probar con curl o con la documentación automática en /docs
```

> La documentación automática de FastAPI está siempre disponible en: http://localhost:8000/docs
