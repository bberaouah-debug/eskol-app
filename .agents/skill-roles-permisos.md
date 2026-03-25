# 🔐 SKILL — Roles, Permisos y Espacios
## Quién puede hacer qué en Eskol

---

## El concepto clave: Espacios del Centro

En lugar de "taller informático", Eskol usa el concepto de **Espacio**.
Un espacio es cualquier lugar del centro que tiene recursos propios.
Cada centro configura los espacios que necesita.

### Ejemplos de espacios por tipo de centro

| Tipo de centro | Espacios típicos |
|---|---|
| FP Informática | Taller informático, Aula de servidores, Biblioteca |
| Instituto (ESO/Bach) | Laboratorio de ciencias, Aula de música, Biblioteca, Gimnasio |
| Colegio (Primaria/Infantil) | Biblioteca, Almacén de deportes, Aula de psicomotricidad |
| Centro con varias etapas | Todos los anteriores, configurables por etapa |

### Modelo de datos de Espacio

```
tabla espacios:
- id
- nombre          ("Taller Informático FP", "Biblioteca", "Lab. Ciencias")
- descripcion
- responsable_id  (FK → users, el técnico o responsable de ese espacio)
- etapa           (opcional: "infantil", "primaria", "secundaria", "fp", "todos")
- activo          (Boolean)
```

Los `items` del inventario siempre pertenecen a un espacio concreto (`espacio_id`).

---

## Roles del sistema

| Rol | Quién es | Descripción |
|---|---|---|
| `admin` | Administrador de la app | Control total del sistema |
| `tecnico` | Técnico del centro | Gestiona recursos e incidencias |
| `pas` | Personal de Admin. y Servicios | Ve recursos, gestiona sus incidencias |
| `profesor` | Docente | Crea incidencias, consulta inventario |
| `alumno` | Alumno | Crea sus propias incidencias (fase 2) |

---

## Tabla de permisos completa

### Módulo: Usuarios

| Acción | admin | tecnico | pas | profesor | alumno |
|---|:---:|:---:|:---:|:---:|:---:|
| Ver lista de usuarios | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crear usuario | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar usuario | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cambiar rol | ✅ | ❌ | ❌ | ❌ | ❌ |
| Desactivar usuario | ✅ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Espacios

| Acción | admin | tecnico | pas | profesor | alumno |
|---|:---:|:---:|:---:|:---:|:---:|
| Ver lista de espacios | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear espacio | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar espacio | ✅ | ❌ | ❌ | ❌ | ❌ |
| Eliminar espacio | ✅ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Inventario (Items)

| Acción | admin | tecnico | pas | profesor | alumno |
|---|:---:|:---:|:---:|:---:|:---:|
| Ver inventario (todos los espacios) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Buscar por código de barras | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver detalle de un item | ✅ | ✅ | ✅ | ✅ | ❌ |
| Crear item | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar item | ✅ | ✅ | ❌ | ❌ | ❌ |
| Subir fotos | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cambiar estado | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dar de baja (soft delete) | ✅ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Incidencias

| Acción | admin | tecnico | pas | profesor | alumno |
|---|:---:|:---:|:---:|:---:|:---:|
| Ver TODAS las incidencias | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver SUS incidencias | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear incidencia | ✅ | ✅ | ✅ | ✅ | ✅ |
| Asignar incidencia a técnico | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cambiar estado de incidencia | ✅ | ✅ | ❌ | ❌ | ❌ |
| Añadir comentario | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cerrar incidencia | ✅ | ✅ | ❌ | ❌ | ❌ |
| Eliminar incidencia | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Implementación en FastAPI

### Dependency de rol

```python
# app/core/security.py

from fastapi import Depends, HTTPException, status
from app.models.user import User

def require_roles(*roles: str):
    """
    Dependency reutilizable para proteger endpoints por rol.
    Uso: current_user: User = Depends(require_roles("admin", "tecnico"))
    """
    def dependency(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta acción"
            )
        return current_user
    return dependency

# Atajos predefinidos para los grupos más comunes:
AdminOnly = Depends(require_roles("admin"))
TecnicoOrAdmin = Depends(require_roles("tecnico", "admin"))
AnyAuthenticated = Depends(get_current_user)
```

### Uso en endpoints

```python
# Solo admins pueden crear espacios
@router.post("/", response_model=EspacioResponse)
def crear_espacio(data: EspacioCreate, db=Depends(get_db), _=AdminOnly):
    ...

# Técnicos y admins pueden crear items
@router.post("/", response_model=ItemResponse)
def crear_item(data: ItemCreate, db=Depends(get_db), user=TecnicoOrAdmin):
    ...

# Cualquier usuario autenticado puede ver el inventario
@router.get("/", response_model=list[ItemResponse])
def listar_items(db=Depends(get_db), user=AnyAuthenticated):
    ...
```

---

## Implementación en React (frontend)

### Hook para comprobar permisos

```tsx
// src/hooks/usePermissions.ts

import { useAuth } from '../context/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isTecnico = user?.role === 'tecnico';
  const isPAS = user?.role === 'pas';
  const isProfesor = user?.role === 'profesor';
  const isAlumno = user?.role === 'alumno';

  const canManageInventory = isAdmin || isTecnico;
  const canViewInventory = isAdmin || isTecnico || isPAS || isProfesor;
  const canCreateIncidencia = true; // Todos los roles autenticados
  const canManageIncidencias = isAdmin || isTecnico;
  const canManageUsers = isAdmin;
  const canManageEspacios = isAdmin;

  return {
    isAdmin, isTecnico, isPAS, isProfesor, isAlumno,
    canManageInventory, canViewInventory,
    canCreateIncidencia, canManageIncidencias,
    canManageUsers, canManageEspacios,
  };
}
```

### Uso en componentes

```tsx
import { usePermissions } from '../hooks/usePermissions';

function InventarioPage() {
  const { canManageInventory } = usePermissions();

  return (
    <div>
      <h1>Inventario</h1>
      {canManageInventory && (
        <button>Añadir elemento</button>
      )}
    </div>
  );
}
```

---

## Flujo de creación de un centro nuevo

Cuando se instala Eskol en un centro nuevo, el orden de configuración es:

```
1. El admin hace login con las credenciales por defecto
2. El admin crea los Espacios del centro (Taller, Biblioteca, Lab...)
3. El admin crea los usuarios (técnicos, profesores, PAS...)
4. Los técnicos empiezan a añadir items al inventario de cada espacio
5. Cualquier usuario puede empezar a crear incidencias
```

---

## Preguntas frecuentes sobre permisos

**¿Un técnico puede ver los espacios de los que no es responsable?**
Sí. Un técnico ve el inventario de todos los espacios. Solo los admins gestionan qué espacios existen.

**¿Un profesor puede saber si un ordenador está disponible?**
Sí. Puede consultar el inventario pero no puede modificarlo ni cambiar estados.

**¿Un alumno puede ver el inventario?**
No en la Fase 1. En fases futuras se podría añadir un permiso de solo lectura para alumno si el centro lo necesita.

**¿Se puede tener un técnico responsable de un espacio concreto?**
Sí. El campo `responsable_id` en la tabla `espacios` permite asignar un técnico como responsable de ese espacio. En fases futuras se puede usar para filtrar las notificaciones de incidencias.
