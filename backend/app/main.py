from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, users, items, espacios
from app.core.database import Base, engine
from app.seed import create_initial_data

# Importamos modelos para que metadata los reconozca.
from app.models.user import User
from app.models.item import Item
from app.models.espacio import Espacio
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Eskol API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8083"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(items.router, prefix="/items", tags=["items"])
app.include_router(espacios.router, prefix="/espacios", tags=["espacios"])

@app.on_event("startup")
def startup():
    create_initial_data()

@app.get("/")
def read_root():
    return {"status": "ok", "app": "Eskol API"}
