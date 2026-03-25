# 🐳 SKILL — Docker Compose
## Cómo gestionar el entorno del proyecto EduGest

---

## Servicios del proyecto

| Servicio | URL local | Para qué sirve |
|---|---|---|
| nginx | http://localhost | Proxy inverso — puerta de entrada |
| wordpress | http://localhost/ | Web pública del centro |
| frontend | http://localhost/app | App de gestión escolar |
| backend | http://localhost/api | API REST (FastAPI) |
| phpmyadmin | http://localhost:8080 | Administrar bases de datos |
| n8n | http://localhost:5678 | Automatizaciones y notificaciones |
| mariadb | interno:3306 | Base de datos relacional |
| mongo | interno:27017 | Base de datos de fotos y archivos |

---

## Comandos esenciales

### Arrancar todo el proyecto
```bash
docker-compose up -d
```

### Ver los logs de un servicio concreto
```bash
docker-compose logs -f backend
docker-compose logs -f wordpress
docker-compose logs -f nginx
```

### Parar todos los servicios
```bash
docker-compose down
```

### Reconstruir un servicio después de cambiar código
```bash
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Acceder a la terminal de un contenedor
```bash
docker-compose exec backend bash
docker-compose exec mariadb bash
```

### Ver el estado de todos los contenedores
```bash
docker-compose ps
```

### Reiniciar un servicio concreto
```bash
docker-compose restart backend
```

### Borrar todo y empezar desde cero (⚠️ borra los datos)
```bash
docker-compose down -v
docker-compose up -d --build
```

---

## Estructura de volúmenes

Los datos persistentes están en `./data/` y **no se suben a Git** (están en `.gitignore`).

```
data/
├── mariadb/     ← Bases de datos relacionales (WordPress + app)
├── mongodb/     ← Fotos y archivos subidos
├── wordpress/   ← Ficheros de WordPress (plugins, temas, uploads)
└── n8n/         ← Workflows de n8n
```

> ⚠️ Si borras la carpeta `data/`, pierdes todos los datos. Haz copias de seguridad antes.

---

## Bases de datos en MariaDB

El mismo servidor MariaDB aloja **dos bases de datos separadas**:

| Base de datos | Quién la usa | Usuario |
|---|---|---|
| `edugest_db` | Backend FastAPI (app de gestión) | `edugestuser` |
| `wordpress_db` | WordPress (web del centro) | `wpuser` |

Para acceder a phpMyAdmin: http://localhost:8080  
Usuario root: definido en `.env` como `MARIADB_ROOT_PASSWORD`

---

## Flujo de trabajo diario

```
1. docker-compose up -d          (arrancar)
2. ... desarrollar y probar ...
3. docker-compose logs -f backend (si algo falla)
4. docker-compose up -d --build backend (si cambias el código del backend)
5. docker-compose down           (al acabar)
```

---

## Problemas comunes

### "Port already in use"
Algún servicio del sistema ya usa ese puerto.
```bash
# Ver qué está usando el puerto 80:
sudo lsof -i :80
# Parar el servicio del sistema que lo ocupa, o cambiar el puerto en docker-compose.yml
```

### El backend arranca pero da error de conexión a MariaDB
MariaDB tarda unos segundos en estar listo. El backend tiene que esperar.
Añade `depends_on` con `condition: service_healthy` y un `healthcheck` a mariadb en el docker-compose.yml.

### WordPress no carga
Comprueba que el servicio wordpress está corriendo y que nginx está enrutando bien:
```bash
docker-compose logs wordpress
docker-compose logs nginx
```

### Cambié el .env pero no se aplica
Las variables de entorno se leen al arrancar el contenedor. Hay que reiniciarlo:
```bash
docker-compose up -d --force-recreate backend
```
