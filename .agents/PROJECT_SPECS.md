# 📋 PROJECT SPECS — Eskol
## Sistema de Gestión de Inventario, Incidencias y Web del Centro

> Versión: 0.2  
> Autores: [Profesor] + [Alumno en prácticas]  
> Fecha: Marzo 2026  
> Herramienta de desarrollo: Antigravity (VS Code adaptado por Google)

---

## 1. Descripción General

Eskol es una plataforma web para gestionar el **inventario de material informático**, las **incidencias técnicas** del centro educativo, y la **web pública del colegio**. Todo el sistema corre sobre Docker, en un único entorno reproducible y fácil de mantener.

El proyecto se desarrolla por **fases incrementales**, usando metodología de *vibe coding* asistida por IA con **Antigravity**.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Uso |
|---|---|---|
| **Backend API** | FastAPI (Python 3.11) | API REST de la aplicación |
| **Frontend App** | TypeScript + Vite + React | Interfaz web de la aplicación |
| **Web del centro** | WordPress | Web pública del colegio |
| **BD relacional** | MariaDB | Usuarios, inventario, incidencias |
| **BD documental** | MongoDB | Fotos, metadatos, logs |
| **Admin BD** | phpMyAdmin | Gestión visual de MariaDB |
| **Automatizaciones** | n8n | Notificaciones, workflows |
| **Proxy inverso** | Nginx | Enruta tráfico entre servicios |
| **Contenedores** | Docker + Docker Compose | Entorno unificado |
| **Internacionalización** | i18next (frontend) | Castellano, Catalán, Gallego, Euskera |

---

## 3. Arquitectura Docker Completa

Todos los servicios corren en la misma red Docker `eskol_net`.
El acceso externo se gestiona a través de **Nginx** como proxy inverso.

```
Puerto 80 / 443  →  Nginx (proxy inverso)
│
├── /              → WordPress (web del centro)
├── /app           → Frontend React (app de inventario)
└── /api           → Backend FastAPI

Servicios internos (no expuestos directamente al exterior):
├── mariadb        → puerto interno 3306
├── mongo          → puerto interno 27017
├── phpmyadmin     → puerto 8080 (solo red interna o VPN)
└── n8n            → puerto 5678 (solo red interna o VPN)
```

### 3.1 Estructura de Carpetas del Proyecto

```
eskol/
├── docker-compose.yml
├── .env                       ← NO subir a Git (en .gitignore)
├── .env.example               ← SÍ subir a Git
├── README.md
├── PROJECT_SPECS.md
├── SKILLS.md
│
├── backend/                   # FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── api/
│       │   ├── auth.py
│       │   ├── users.py
│       │   ├── items.py
│       │   └── incidencias.py
│       ├── models/
│       ├── schemas/
│       ├── crud/
│       ├── core/
│       │   ├── config.py
│       │   ├── security.py
│       │   └── database.py
│       ├── main.py
│       └── seed.py
│
├── frontend/                  # Vite + React + TypeScript
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── locales/           # Traducciones i18n
│       │   ├── es/
│       │   │   ├── common.json
│       │   │   ├── auth.json
│       │   │   ├── inventario.json
│       │   │   └── incidencias.json
│       │   └── ca/
│       │       ├── common.json
│       │       ├── auth.json
│       │       ├── inventario.json
│       │       └── incidencias.json
│       ├── pages/
│       ├── components/
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── api/
│       └── types/
│
├── nginx/
│   └── nginx.conf             # Proxy inverso
│
├── wordpress/
│   └── wp-content/            # Temas y plugins personalizados
│
└── data/                      # Volúmenes persistentes — NO subir a Git
    ├── mariadb/
    ├── mongodb/
    ├── wordpress/
    └── n8n/
```

### 3.2 Nota sobre MariaDB compartida

> ⚠️ MariaDB es compartido por WordPress y la app de inventario, pero cada uno usa su **propia base de datos**:
> - `eskol_db` → para la aplicación de inventario (FastAPI)
> - `wordpress_db` → para WordPress

---

## 4. Internacionalización (i18n)

La aplicación React soporta múltiples idiomas desde el primer día.

### 4.1 Tecnología

- **Librería:** `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- **Detección automática** del idioma del navegador
- El usuario puede **cambiar el idioma** desde la barra de navegación

### 4.2 Idiomas Soportados

| Código | Idioma | Estado |
|---|---|---|
| `es` | Castellano | ✅ Principal |
| `ca` | Catalán | 🔜 Fase 1 |
| `gl` | Gallego | 🔜 Futuro |
| `eu` | Euskera | 🔜 Futuro |

### 4.3 Uso en Componentes

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('inventario');
<h1>{t('titulo')}</h1>
// → Castellano: "Inventario del Taller"
// → Catalán:    "Inventari del Taller"
```

### 4.4 Regla de Oro i18n

> **NUNCA** escribir textos de interfaz hardcodeados en los componentes.
> Siempre usar `t('clave')`. Si falta una clave, añadirla al fichero JSON correspondiente.

---

## 5. Roles y Permisos

| Rol | Descripción | Permisos principales |
|---|---|---|
| `admin` | Administrador de la aplicación | Todo |
| `tecnico` | Técnico del taller | Inventario completo, incidencias |
| `pas` | Personal de Administración y Servicios | Ver inventario, gestionar incidencias propias |
| `profesor` | Docente del centro | Crear y ver sus incidencias |
| `alumno` | Alumno del centro | Crear incidencias (fase 2) |

---

## 6. Fases del Proyecto

---

### FASE 0 — Autenticación y Usuarios *(Prioridad ALTA)*

**Objetivo:** Login funcional con JWT, gestión de usuarios y selector de idioma.

#### 6.0.1 Backend (FastAPI)

- [ ] Modelo `User` en MariaDB: `id, username, email, hashed_password, role, active, created_at`
- [ ] `POST /auth/login` → devuelve JWT token
- [ ] `GET /auth/me` → datos del usuario autenticado
- [ ] Dependency `get_current_user` para proteger rutas
- [ ] Verificación de rol en rutas protegidas
- [ ] Hash de contraseñas con `bcrypt`
- [ ] Seed: usuario `admin` creado al primer arranque

#### 6.0.2 Frontend (React + TS)

- [ ] Configuración base de `i18next` con castellano como idioma por defecto
- [ ] Página de Login (`/login`): formulario, gestión de errores, selector de idioma
- [ ] `AuthContext` global (login, logout, usuario, rol)
- [ ] Redirección automática al login si no autenticado (`ProtectedRoute`)
- [ ] Dashboard diferente por rol tras el login
- [ ] Selector de idioma permanente en la barra de navegación

#### 6.0.3 Panel de Administración de Usuarios (solo admin)

- [ ] Listar usuarios (`GET /users`)
- [ ] Crear usuario (`POST /users`)
- [ ] Editar usuario / cambiar rol (`PUT /users/{id}`)
- [ ] Desactivar usuario (soft delete)

#### Entregable Fase 0
✅ Se puede hacer login. El admin puede crear usuarios. El idioma se puede cambiar entre castellano y catalán.

---

### FASE 1 — Inventario del Taller *(Prioridad ALTA)*

**Objetivo:** Catalogar todo el material del taller con fotos y código de barras.

#### 6.1.1 Modelos de Datos

**MariaDB — tabla `items`:**
```
id, codigo_barras (VARCHAR 50, UNIQUE), nombre, descripcion,
categoria (ENUM), estado (ENUM), ubicacion,
fecha_alta, fecha_modificacion, activo (BOOL),
creado_por_id (FK → users)
```

**Categorías:** `Ordenador, Portátil, Impresora, Disco_Duro, Periférico, Monitor, Cable, Otro`

**Estados y colores:**

| Estado | Color visual |
|---|---|
| `disponible` | Verde |
| `en_uso` | Amarillo |
| `en_reparacion` | Naranja |
| `de_baja` | Rojo |
| `reservado` | Azul |

**MongoDB — colección `item_fotos`:**
```json
{
  "item_id": 123,
  "foto_url": "/uploads/items/foto.jpg",
  "fecha": "2026-03-25T10:00:00Z",
  "subida_por": "admin"
}
```

#### 6.1.2 Backend

- [ ] `GET /items` — listado con filtros: categoría, estado, búsqueda por nombre o código
- [ ] `GET /items/{id}` — detalle + fotos desde MongoDB
- [ ] `POST /items` — crear item (técnico, admin)
- [ ] `PUT /items/{id}` — editar (técnico, admin)
- [ ] `DELETE /items/{id}` — soft delete (admin)
- [ ] `POST /items/{id}/fotos` — subir foto (guardada en MongoDB + disco)
- [ ] `GET /items/barcode/{codigo}` — buscar por código de barras

#### 6.1.3 Frontend

- [ ] Página `/inventario` con búsqueda en tiempo real + filtros
- [ ] Vista en tarjetas (card) y vista en tabla (toggle)
- [ ] Página de detalle `/inventario/{id}` con galería de fotos
- [ ] Formulario de creación y edición de item
- [ ] **Captura de foto** desde la cámara del dispositivo (`getUserMedia`)
- [ ] **Escáner de código de barras** en el navegador (`@zxing/browser`)
- [ ] Todos los textos de interfaz traducibles (es/ca)

#### Entregable Fase 1
✅ Se puede fotografiar, escanear y catalogar cualquier elemento del taller.

---

### FASE 2 — Gestión de Incidencias *(Prioridad MEDIA)*

**Objetivo:** Cualquier miembro del centro puede reportar una incidencia técnica.

#### 6.2.1 Modelos de Datos

**MariaDB — tabla `incidencias`:**
```
id, titulo, descripcion,
prioridad (ENUM: baja/normal/alta/urgente),
estado (ENUM: nueva/asignada/en_curso/resuelta/cerrada),
item_id (FK → items, opcional), ubicacion,
creado_por_id (FK → users), asignado_a_id (FK → users, opcional),
fecha_creacion, fecha_resolucion
```

**MariaDB — tabla `incidencia_comentarios`:**
```
id, incidencia_id (FK), usuario_id (FK), texto (TEXT), fecha_creacion
```

#### 6.2.2 Backend

- [ ] `GET /incidencias` — filtrado por rol
- [ ] `POST /incidencias` — crear (todos los roles)
- [ ] `PUT /incidencias/{id}` — actualizar estado / asignar técnico
- [ ] `POST /incidencias/{id}/comentarios` — añadir comentario
- [ ] `GET /incidencias/{id}` — detalle con comentarios
- [ ] Llamada al webhook n8n cuando la prioridad es "urgente"

#### 6.2.3 Frontend

- [ ] Vista Kanban para técnicos/admin (columnas: nueva, asignada, en_curso, resuelta)
- [ ] Lista simple con estados para otros roles
- [ ] Formulario de nueva incidencia (con selector de item del inventario, opcional)
- [ ] Página de detalle con historial de comentarios
- [ ] Todos los textos traducibles (es/ca)

#### Entregable Fase 2
✅ Un profesor puede reportar una avería. Un técnico la gestiona desde el Kanban.

---

### FASE 3 — WordPress: Web del Centro *(Prioridad MEDIA)*

**Objetivo:** El colegio tiene una web pública integrada en el mismo entorno Docker.

- [ ] WordPress accesible desde `/` mediante Nginx
- [ ] Usa `wordpress_db` en el mismo MariaDB (usuario separado)
- [ ] Tema adaptado a la identidad visual del centro
- [ ] Secciones básicas: Inicio, Noticias, Contacto, Oferta educativa
- [ ] El acceso a `/app` sigue siendo la aplicación React
- [ ] El acceso a `/api` sigue siendo FastAPI

#### Entregable Fase 3
✅ La web del colegio y la app de inventario conviven en el mismo servidor.

---

### FASE 4 — Automatizaciones n8n *(Prioridad BAJA)*

- [ ] Workflow: incidencia urgente → notificación Telegram al técnico
- [ ] Workflow: resumen semanal de inventario por email al admin
- [ ] Workflow: alerta si un item lleva >30 días en estado `en_reparacion`
- [ ] Workflow: email de bienvenida al crear un usuario nuevo

---

## 7. Variables de Entorno (`.env.example`)

```env
# ─── MariaDB ───────────────────────────────────────────
MARIADB_ROOT_PASSWORD=rootpass

# Base de datos de la app de inventario
MARIADB_DATABASE=eskol_db
MARIADB_USER=talleruser
MARIADB_PASSWORD=tallerpass

# Base de datos de WordPress (mismo servidor MariaDB)
WORDPRESS_DB_NAME=wordpress_db
WORDPRESS_DB_USER=wpuser
WORDPRESS_DB_PASSWORD=wppass

# ─── MongoDB ───────────────────────────────────────────
MONGO_INITDB_ROOT_USERNAME=mongoadmin
MONGO_INITDB_ROOT_PASSWORD=mongopass
MONGO_DATABASE=eskol_media

# ─── Backend FastAPI ───────────────────────────────────
SECRET_KEY=cambia_esto_en_produccion_usa_openssl_rand
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ─── Usuario admin por defecto (seed) ──────────────────
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin1234!
ADMIN_EMAIL=admin@taller.local

# ─── WordPress ─────────────────────────────────────────
WP_ADMIN_USER=wpadmin
WP_ADMIN_PASSWORD=WpAdmin1234!
WP_ADMIN_EMAIL=web@colegio.local

# ─── i18n ──────────────────────────────────────────────
DEFAULT_LANGUAGE=es
```

---

## 8. Convenciones de Código

- **Python:** PEP8, type hints, docstrings en castellano
- **TypeScript:** strict mode activado, interfaces TypeScript para todos los modelos
- **i18n:** Nunca textos hardcodeados en componentes — siempre `t('clave')`
- **Commits:** mensajes en imperativo en castellano: `Añadir endpoint login`, `Crear componente inventario`
- **Ramas Git:** `main` (estable) → `fase-0`, `fase-1`, `fase-2`, `fase-3`, `fase-4`
- **API:** respuestas JSON con formato estándar: `{ data, message, status }`

---

## 9. Orden de Desarrollo Recomendado

```
 1.  docker-compose.yml completo (todos los servicios)
 2.  nginx.conf (proxy inverso básico)
 3.  Backend: estructura de carpetas + requirements.txt
 4.  Backend: conexión MariaDB (SQLAlchemy)
 5.  Backend: modelo User + seed de admin
 6.  Backend: endpoints de autenticación (login, me)
 7.  Frontend: proyecto Vite + i18next configurado
 8.  Frontend: página Login + AuthContext
 9.  Frontend: ProtectedRoute + rutas por rol
10.  Backend: CRUD de usuarios
11.  Frontend: panel de administración de usuarios
12.  Backend: modelo Item + endpoints CRUD
13.  Frontend: página de inventario (lista + formulario)
14.  Backend: subida de fotos (MongoDB)
15.  Frontend: cámara + escáner de código de barras
16.  WordPress: configurar en Docker + conectar a Nginx
17.  Backend: modelo Incidencia + endpoints
18.  Frontend: dashboard de incidencias (Kanban)
19.  n8n: workflows de notificaciones
20.  Traducciones al catalán (revisar todos los JSON de /locales/ca/)
```
