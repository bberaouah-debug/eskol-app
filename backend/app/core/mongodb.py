from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None

db_mongo = MongoDB()

def get_mongo_db():
    return db_mongo.client[settings.MONGO_DATABASE]

async def connect_mongo():
    db_mongo.client = AsyncIOMotorClient(settings.MONGO_URL)
    print("MongoDB conectado.")

async def disconnect_mongo():
    if db_mongo.client:
        db_mongo.client.close()
        print("MongoDB desconectado.")
