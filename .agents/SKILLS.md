# 🧠 SKILLS — Guía de Prompts para Eskol
## Cómo construir el proyecto paso a paso con Antigravity

> Para: Alumno en prácticas (GM)  
> Herramienta: **Antigravity** (VS Code adaptado por Google)  
> Metodología: Vibe Coding incremental — un prompt, una tarea

---

## Reglas de Oro antes de hacer cualquier prompt

1. **Un prompt = una tarea.** Nunca pidas dos cosas a la vez.
2. **Siempre da contexto.** La IA no sabe nada si no se lo dices.
3. **Lee el código antes de ejecutarlo.** Si no entiendes algo, pregúntale que te lo explique.
4. **Haz commit después de cada cosa que funcione.**
5. **Nunca escribas textos de interfaz directamente** en los componentes — usa siempre `t('clave')`.

---

## BLOQUE 0 — Entorno Docker

### Prompt 0.1 — Crear el docker-compose.yml completo

```
Crea un fichero docker-compose.yml para un proyecto llamado Eskol
con los siguientes servicios, todos en la misma red Docker llamada "eskol_net":

- nginx: imagen nginx:alpine, puertos 80:80 y 443:443
  proxy inverso que enruta:
    /      → wordpress:80
    /app   → frontend:80
    /api   → backend:8000

- backend: FastAPI Python 3.11, Dockerfile en ./backend, puerto interno 8000
  variables de entorno desde .env

- frontend: Vite + React + TypeScript, Dockerfile en ./frontend, puerto interno 80
  (build de producción servido por nginx interno del contenedor)

- wordpress: imagen wordpress:latest, puerto interno 80
  conectado a MariaDB con las variables de entorno del .env
  volumen en ./data/wordpress

- mariadb: imagen mariadb:10.11, puerto interno 3306
  volumen en ./data/mariadb
  variables de entorno desde .env

- mongo: imagen mongo:7, puerto interno 27017
  volumen en ./data/mongodb
  variables de entorno desde .env

- phpmyadmin: imagen phpmyadmin:latest, puerto 8080:80
  conectado al servicio mariadb

- n8n: imagen n8nio/n8n, puerto 5678:5678
  volumen en ./data/n8n
  variables de entorno desde .env

Usa variables de entorno referenciando un fichero .env
```

---

### Prompt 0.2 — Crear el fichero .env.example

```
Crea el fichero .env.example para el docker-compose.yml que hemos creado.
Debe tener las variables para:
- MariaDB: root password, base de datos de la app (eskol_db) y de WordPress (wordpress_db), con usuarios separados
- MongoDB: usuario y contraseña de root, nombre de la base de datos
- Backend FastAPI: SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
- Credenciales del usuario admin por defecto: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL
- WordPress: WP_ADMIN_USER, WP_ADMIN_PASSWORD, WP_ADMIN_EMAIL
- i18n: DEFAULT_LANGUAGE=es

Añade comentarios explicativos en cada sección.
```

---

### Prompt 0.3 — Configurar Nginx como proxy inverso

```
Crea el fichero nginx/nginx.conf para que Nginx actúe como proxy inverso con estas rutas:
- / → redirige al servicio "wordpress" puerto 80
- /app → redirige al servicio "frontend" puerto 80
- /api → redirige al servicio "backend" puerto 8000

Importante: las rutas /app y /api deben pasar los headers correctos
(Host, X-Real-IP, X-Forwarded-For) para que los servicios funcionen bien.
```

---

### Prompt 0.4 — Dockerfile del backend

```
Crea el Dockerfile para el backend FastAPI con Python 3.11-slim.
Debe:
1. Instalar las dependencias de requirements.txt
2. Copiar el código de la aplicación
3. Ejecutar: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

El fichero requirements.txt debe incluir:
fastapi, uvicorn[standard], sqlalchemy, pymysql, cryptography,
pydantic, pydantic-settings, python-jose[cryptography],
passlib[bcrypt], python-multipart, motor, aiofiles
```

---

### Prompt 0.5 — Dockerfile del frontend

```
Crea un Dockerfile multi-stage para el frontend Vite + React + TypeScript:
- Stage 1 (build): node:20-alpine, npm ci, npm run build
- Stage 2 (serve): nginx:alpine, copia el build a /usr/share/nginx/html
  con una configuración nginx que maneje las rutas de React (SPA fallback a index.html)
Expone el puerto 80.
```

---

## BLOQUE 1 — Backend: Estructura y Base de Datos

### Prompt 1.1 — Estructura de carpetas del backend

```
Crea la estructura de carpetas y ficheros vacíos para el backend FastAPI
del proyecto Eskol con este árbol:

backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── seed.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── items.py
│   │   └── incidencias.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── item.py
│   │   └── incidencia.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── item.py
│   │   └── incidencia.py
│   ├── crud/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── item.py
│   │   └── incidencia.py
│   └── core/
│       ├── __init__.py
│       ├── config.py
│       ├── security.py
│       └── database.py

Pon un comentario # TODO al principio de cada fichero.
```

---

### Prompt 1.2 — Configuración y conexión a MariaDB

```
En el proyecto FastAPI Eskol, implementa:

1. app/core/config.py:
   Clase Settings usando pydantic-settings que lea desde .env:
   DATABASE_URL, MONGO_URL, SECRET_KEY, ALGORITHM,
   ACCESS_TOKEN_EXPIRE_MINUTES, ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL

2. app/core/database.py:
   Conexión a MariaDB con SQLAlchemy 2.0:
   - engine, SessionLocal, Base (DeclarativeBase)
   - Función get_db() como dependency de FastAPI
```

---

### Prompt 1.3 — Modelo de Usuario

```
En app/models/user.py, crea el modelo SQLAlchemy para la tabla "users":
- id: Integer, PK, autoincrement
- username: String(50), UNIQUE, NOT NULL
- email: String(100), UNIQUE, NOT NULL
- hashed_password: String(255), NOT NULL
- role: Enum con valores: admin, tecnico, pas, profesor, alumno
- active: Boolean, default True
- created_at: DateTime, default utcnow

Importa Base desde app.core.database.
Crea también la tabla al importar el modelo en main.py (Base.metadata.create_all).
```

---

### Prompt 1.4 — Seguridad: JWT y bcrypt

```
En app/core/security.py, implementa estas funciones:

- hash_password(password: str) → str
  Hashea una contraseña usando passlib con bcrypt

- verify_password(plain: str, hashed: str) → bool
  Comprueba si la contraseña es correcta

- create_access_token(data: dict, expires_delta: timedelta | None) → str
  Crea un JWT con los datos y una fecha de expiración

- decode_token(token: str) → dict | None
  Decodifica un JWT. Devuelve None si es inválido o ha expirado

Lee SECRET_KEY y ALGORITHM desde Settings.
```

---

### Prompt 1.5 — Endpoints de autenticación

```
En app/api/auth.py, crea un router FastAPI con:

POST /auth/login
- Recibe: { username: str, password: str } como JSON o form
- Busca el usuario en MariaDB por username
- Verifica la contraseña con verify_password
- Si es correcto: devuelve { access_token, token_type: "bearer", user: { id, username, role } }
- Si es incorrecto: HTTPException 401

GET /auth/me
- Requiere JWT en el header Authorization: Bearer <token>
- Devuelve los datos del usuario autenticado

Crea la dependency get_current_user(token: str = Depends(oauth2_scheme))
que extrae y valida el usuario del JWT.
```

---

### Prompt 1.6 — Seed: usuario admin al arrancar

```
En app/seed.py, crea la función create_default_admin(db: Session):
- Comprueba si ya existe algún usuario con role="admin"
- Si no existe, crea uno con las credenciales de ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL
  (password hasheado con hash_password)
- Imprime en consola "Admin creado: {username}" o "Admin ya existe"

En app/main.py, llama a esta función en el evento @app.on_event("startup").
```

---

## BLOQUE 2 — Frontend: Base e i18n

### Prompt 2.1 — Crear el proyecto Vite y configurar i18n

```
Muéstrame los comandos para crear un proyecto Vite + React + TypeScript llamado "frontend".

Después, lista las dependencias a instalar:
- react-router-dom (enrutamiento)
- axios (peticiones HTTP)
- react-hook-form (formularios)
- i18next react-i18next i18next-browser-languagedetector (internacionalización)
- @types/react @types/react-dom (tipado)

Luego, crea el fichero src/i18n.ts que configure i18next con:
- Idioma por defecto: "es"
- Detección automática del idioma del navegador
- Namespaces: common, auth, inventario, incidencias
- Carga de traducciones desde src/locales/{idioma}/{namespace}.json

Y crea los ficheros de traducción iniciales para:
- src/locales/es/common.json con claves: app_name, loading, save, cancel, logout, language
- src/locales/ca/common.json con las mismas claves traducidas al catalán
```

---

### Prompt 2.2 — AuthContext global

```
Crea src/context/AuthContext.tsx para React.
Debe gestionar el estado global de autenticación:

- Estado: user (id, username, role), token, isLoading
- Al cargar la app: comprobar si hay token en localStorage y restaurar sesión
- login(username, password): llama a POST /api/auth/login,
  guarda el token en localStorage, actualiza el estado
- logout(): limpia localStorage, resetea estado, redirige a /login
- Hook useAuth() para acceder al contexto desde cualquier componente

Exporta AuthProvider (para envolver la app en main.tsx) y useAuth.
Usa TypeScript con interfaces para los tipos de usuario y contexto.
```

---

### Prompt 2.3 — Página de Login

```
Crea src/pages/Login.tsx para el proyecto Eskol.
Debe ser un formulario de login con:
- Campo "Usuario" (username, obligatorio)
- Campo "Contraseña" (password, obligatorio)
- Botón "Entrar" con estado loading (deshabilitado mientras carga)
- Mensaje de error si las credenciales son incorrectas
- Redirigir a /app/dashboard si el login es correcto
- Selector de idioma (castellano / catalán) usando i18next
  que cambie el idioma de toda la app al seleccionarlo

Usa react-hook-form para gestionar el formulario.
Usa el hook useAuth() para llamar a la función login.
Todos los textos deben usar t() de i18next (namespace: auth).
El diseño debe ser limpio y profesional, con el nombre "Eskol" visible.
```

---

### Prompt 2.4 — Rutas protegidas por rol

```
Crea src/components/ProtectedRoute.tsx que:
- Compruebe si el usuario está autenticado (via useAuth)
- Si no lo está, redirija a /login
- Acepte una prop opcional "allowedRoles: string[]"
  Si se especifica y el rol del usuario no está en la lista:
  muestre un mensaje de "403 - No tienes permiso para acceder a esta página"
- Si está autenticado y tiene el rol correcto, renderice el componente hijo

Muestra cómo usar ProtectedRoute en App.tsx para proteger:
- /app/dashboard → cualquier usuario autenticado
- /app/inventario → tecnico, admin
- /app/admin/usuarios → solo admin
```

---

### Prompt 2.5 — Layout principal con Navbar y Sidebar

```
Crea src/components/Layout.tsx con:

Navbar superior:
- Logo/nombre "Eskol" a la izquierda
- Nombre del usuario autenticado + badge con su rol en el centro
- Selector de idioma (es/ca) a la derecha
- Botón "Cerrar sesión" a la derecha

Sidebar izquierdo con menú por rol:
- Todos los roles: "Dashboard", "Inventario"
- Solo tecnico y admin: "Incidencias"
- Solo admin: "Usuarios", "Configuración"

Área de contenido principal donde se renderizan las páginas hijas.

Todos los textos del menú deben usar t() de i18next (namespace: common).
Usa React Router NavLink para los enlaces con estilo activo.
```

---

## BLOQUE 3 — Inventario (Fase 1)

### Prompt 3.1 — Modelo y CRUD de items en el backend

```
Crea el modelo SQLAlchemy y los endpoints CRUD para los items del inventario:

Modelo (app/models/item.py) — tabla "items":
- id, codigo_barras (VARCHAR 50, UNIQUE), nombre (String 200), descripcion (Text)
- categoria: Enum(Ordenador, Portátil, Impresora, Disco_Duro, Periférico, Monitor, Cable, Otro)
- estado: Enum(disponible, en_uso, en_reparacion, de_baja, reservado)
- ubicacion (String 100, opcional)
- fecha_alta (DateTime, default now), fecha_modificacion (DateTime, onupdate now)
- activo (Boolean, default True)
- creado_por_id (Integer, ForeignKey → users.id)

Endpoints (app/api/items.py):
- GET /items → lista con filtros opcionales: ?categoria=&estado=&buscar=
  (buscar por nombre o codigo_barras)
- GET /items/{id} → detalle
- POST /items → crear (solo tecnico, admin)
- PUT /items/{id} → editar (solo tecnico, admin)
- DELETE /items/{id} → soft delete: activo=False (solo admin)
- GET /items/barcode/{codigo} → buscar por código de barras exacto
```

---

### Prompt 3.2 — Página de inventario en el frontend

```
Crea src/pages/Inventario.tsx con:
- Título traducible con t('titulo') del namespace inventario
- Barra de búsqueda en tiempo real (filtra por nombre o código de barras)
- Filtros de categoría y estado (selects)
- Botón "Añadir elemento" (solo visible para tecnico y admin)
- Toggle entre vista de tarjetas y vista de tabla

Vista de tarjeta: muestra nombre, categoría, estado (badge con color), ubicación
Vista de tabla: columnas nombre, código de barras, categoría, estado, ubicación, acciones

Al hacer clic en una tarjeta/fila: navegar a /app/inventario/{id}

Usa axios para las peticiones a GET /api/items.
Define la interfaz TypeScript Item con todos los campos del modelo.
Todos los textos usan t() de i18next.
```

---

### Prompt 3.3 — Componente de captura de foto

```
Crea src/components/CameraCapture.tsx que:
- Abra la cámara del dispositivo con navigator.mediaDevices.getUserMedia({ video: true })
- Muestre el stream de vídeo en un elemento <video>
- Tenga un botón "Hacer foto" que capture un frame como imagen PNG
  usando un <canvas> oculto
- Muestre la foto capturada para previsualización
- Tenga botones "Aceptar" y "Repetir"
- Al aceptar, llame a la prop onCapture(file: File) con la imagen como fichero
- Gestione el error si el dispositivo no tiene cámara
- Tenga un botón "Cerrar" para cancelar

Props: onCapture: (file: File) => void, onClose: () => void
```

---

### Prompt 3.4 — Componente escáner de código de barras

```
Instala @zxing/browser para leer códigos de barras desde la cámara.

Crea src/components/BarcodeScanner.tsx que:
- Active la cámara y escanee continuamente con BrowserMultiFormatReader de @zxing/browser
- Cuando detecte un código de barras, llame a onScan(code: string) y cierre el escáner
- Muestre el stream de vídeo con un recuadro visual indicando el área de escaneo
- Tenga un botón "Cancelar" para cerrar sin escanear
- Limpie correctamente el stream de la cámara al desmontar el componente (useEffect cleanup)

Props: onScan: (code: string) => void, onClose: () => void

Muestra cómo usar BarcodeScanner en el formulario de creación de item
para rellenar automáticamente el campo "codigo_barras".
```

---

## BLOQUE 4 — Incidencias (Fase 2)

### Prompt 4.1 — Modelo y endpoints de incidencias

```
Crea el modelo y endpoints para la gestión de incidencias:

Modelos (app/models/incidencia.py):

Tabla "incidencias":
- id, titulo (String 200), descripcion (Text)
- prioridad: Enum(baja, normal, alta, urgente)
- estado: Enum(nueva, asignada, en_curso, resuelta, cerrada)
- item_id (FK → items.id, nullable), ubicacion (String, nullable)
- creado_por_id (FK → users.id), asignado_a_id (FK → users.id, nullable)
- fecha_creacion (DateTime, default now), fecha_resolucion (DateTime, nullable)

Tabla "incidencia_comentarios":
- id, incidencia_id (FK), usuario_id (FK), texto (Text), fecha_creacion

Endpoints (app/api/incidencias.py):
- GET /incidencias → filtrado por rol:
  admin/tecnico ven todas; los demás solo las suyas (creado_por_id = usuario actual)
- POST /incidencias → crear (todos los roles)
  Si prioridad == "urgente": hacer POST al webhook de n8n (URL desde .env)
- PUT /incidencias/{id} → cambiar estado y/o asignar técnico (tecnico, admin)
- GET /incidencias/{id} → detalle + lista de comentarios
- POST /incidencias/{id}/comentarios → añadir comentario (todos los roles)
```

---

### Prompt 4.2 — Dashboard de incidencias

```
Crea src/pages/Incidencias.tsx con dos vistas según el rol:

Vista para tecnico y admin — Kanban:
4 columnas: Nueva | Asignada | En curso | Resuelta
Cada columna muestra las tarjetas de incidencias en ese estado.
Cada tarjeta muestra: título, prioridad (badge de color), quién la creó, fecha.
Al hacer clic en una tarjeta: abrir panel lateral con el detalle y comentarios.

Vista para otros roles — Lista:
Tabla con columnas: título, prioridad, estado, fecha, acciones.
Solo muestran las incidencias que ellos han creado.

Botón "Nueva incidencia" visible para todos los roles.
Formulario modal con: título (obligatorio), descripción, prioridad, ubicación,
y selector de item del inventario (búsqueda opcional).

Todos los textos usan t() de i18next (namespace: incidencias).
```

---

## BLOQUE 5 — n8n Automatizaciones

### Prompt 5.1 — Workflow de incidencia urgente

```
Explícame paso a paso cómo crear en n8n (accesible en localhost:5678)
un workflow que:
1. Tenga un nodo Webhook que escuche en POST /webhook/nueva-incidencia-urgente
2. Reciba los datos: titulo, descripcion, creado_por, ubicacion
3. Envíe un mensaje de Telegram a un canal con el resumen de la incidencia
4. Responda al webhook con { ok: true }

Además, muéstrame cómo llamar a este webhook desde el endpoint
POST /incidencias de FastAPI cuando la prioridad sea "urgente".
Usa httpx para la llamada asíncrona desde Python.
```

---

## 🔧 Prompts de Depuración

### Error de CORS

```
Mi backend FastAPI en localhost:8000 rechaza las peticiones
de mi frontend en localhost:5173 con un error de CORS.
Muéstrame cómo configurar CORSMiddleware en app/main.py
para permitir peticiones desde http://localhost:5173
con los métodos GET, POST, PUT, DELETE y el header Authorization.
```

---

### JWT no funciona (error 401)

```
Mi endpoint GET /auth/me protegido por JWT devuelve 401.
Estoy enviando el token en el header: Authorization: Bearer <token>
Aquí está el código de mi dependency get_current_user: [pega el código]
Aquí está el código de create_access_token: [pega el código]
¿Qué puede estar fallando?
```

---

### Contenedor Docker no arranca

```
Al hacer docker-compose up, el contenedor [nombre] falla con este error:
[pega el error completo]

Aquí está mi Dockerfile: [pega el Dockerfile]
Aquí está el servicio en docker-compose.yml: [pega el servicio]

¿Por qué falla y cómo lo soluciono?
```

---

### Texto no se traduce

```
Estoy usando react-i18next en mi proyecto Eskol.
El hook t('clave') me devuelve la clave en lugar de la traducción.
Aquí está mi configuración de i18n.ts: [pega el código]
Aquí está el fichero de traducciones: [pega el JSON]
¿Qué puede estar fallando?
```

---

## 📌 Checklist de cada sesión de trabajo

Antes de acabar cada sesión, verifica:

- [ ] El código que has generado **compila sin errores**
- [ ] Has **probado** la funcionalidad manualmente en el navegador o con curl
- [ ] Has hecho **git add + commit** con un mensaje descriptivo
- [ ] Has marcado los ✅ correspondientes en PROJECT_SPECS.md
- [ ] Todos los textos nuevos están en los **ficheros de traducción** (es + ca)
- [ ] Entiendes **qué hace** cada fichero que has creado — si no, pregunta
