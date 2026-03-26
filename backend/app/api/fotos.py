from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from bson import ObjectId
import aiofiles
import io

from app.core.database import get_db
from app.core.mongodb import get_mongo_db
from app.api.auth import get_current_user
from app.models.user import User, RoleEnum
from app.crud.item import get_item

router = APIRouter()

def get_privileged_user(current_user: User = Depends(get_current_user)):
    if current_user.role not in [RoleEnum.admin, RoleEnum.tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos suficientes")
    return current_user

@router.post("/{item_id}/fotos")
async def upload_foto(
    item_id: int,
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_privileged_user)
):
    """Sube una foto de un item y la guarda en MongoDB."""
    db_item = get_item(db, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    # Validar tipo de fichero
    if not foto.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes")
    
    contents = await foto.read()
    
    mongo_db = get_mongo_db()
    result = await mongo_db.item_fotos.insert_one({
        "item_id": item_id,
        "filename": foto.filename,
        "content_type": foto.content_type,
        "data": contents,
        "uploaded_by": user.id
    })
    
    return {
        "id": str(result.inserted_id),
        "item_id": item_id,
        "filename": foto.filename,
        "url": f"/items/{item_id}/fotos/{str(result.inserted_id)}"
    }


@router.get("/{item_id}/fotos")
async def list_fotos(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista las fotos de un item."""
    db_item = get_item(db, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    mongo_db = get_mongo_db()
    cursor = mongo_db.item_fotos.find(
        {"item_id": item_id},
        {"data": 0}  # Excluir los bytes del listado
    )
    fotos = []
    async for doc in cursor:
        fotos.append({
            "id": str(doc["_id"]),
            "item_id": doc["item_id"],
            "filename": doc.get("filename"),
            "content_type": doc.get("content_type"),
            "url": f"/items/{item_id}/fotos/{str(doc['_id'])}"
        })
    return fotos


@router.get("/{item_id}/fotos/{foto_id}")
async def get_foto(
    item_id: int,
    foto_id: str,
    token: str | None = None,
    db: Session = Depends(get_db)
):
    """Devuelve una foto como fichero estático."""
    from app.core.security import decode_token
    from app.models.user import User

    if not token:
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Token inválido")
    
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.active:
        raise HTTPException(status_code=401, detail="Usuario inválido")
    try:
        oid = ObjectId(foto_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de foto inválido")
    
    mongo_db = get_mongo_db()
    doc = await mongo_db.item_fotos.find_one({"_id": oid, "item_id": item_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    
    return Response(
        content=doc["data"],
        media_type=doc.get("content_type", "image/jpeg")
    )


@router.delete("/{item_id}/fotos/{foto_id}")
async def delete_foto(
    item_id: int,
    foto_id: str,
    user: User = Depends(get_privileged_user)
):
    """Elimina una foto."""
    try:
        oid = ObjectId(foto_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID de foto inválido")
    
    mongo_db = get_mongo_db()
    result = await mongo_db.item_fotos.delete_one({"_id": oid, "item_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    
    return {"ok": True}
