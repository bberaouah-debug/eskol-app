from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import auth, users, items, espacios, fotos, tipus_dispositiu
from app.core.database import Base, engine
from app.core.mongodb import connect_mongo, disconnect_mongo
from app.seed import create_initial_data

# Importamos modelos para que metadata los reconozca.
from app.models.user import User
from app.models.item import Item
from app.models.espacio import Espacio
from app.models.tipus_dispositiu import TipusDispositiu
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    create_initial_data()
    yield
    await disconnect_mongo()

app = FastAPI(title="Eskol API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?:\/\/.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(items.router, prefix="/items", tags=["items"])
app.include_router(espacios.router, prefix="/espacios", tags=["espacios"])
app.include_router(tipus_dispositiu.router, prefix="/tipus-dispositiu", tags=["tipus-dispositiu"])
app.include_router(fotos.router, prefix="/items", tags=["fotos"])

@app.get("/")
def read_root():
    return {"status": "ok", "app": "Eskol API"}
