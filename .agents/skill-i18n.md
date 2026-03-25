# 🌐 SKILL — Internacionalización (i18n)
## Cómo gestionar los idiomas en Eskol

---

## Regla de Oro

> **Nunca** escribas un texto de interfaz directamente en un componente.
> Siempre usa `t('clave')`. Sin excepciones.

```tsx
// ❌ MAL — texto hardcodeado
<h1>Inventario de recursos</h1>

// ✅ BIEN — texto traducible
const { t } = useTranslation('inventario');
<h1>{t('titulo')}</h1>
```

---

## Estructura de ficheros de traducción

```
src/locales/
├── es/                        ← Castellano (idioma principal)
│   ├── common.json            ← Textos generales: botones, mensajes, navegación
│   ├── auth.json              ← Login, logout, permisos, errores de acceso
│   ├── inventario.json        ← Módulo de inventario y recursos
│   └── incidencias.json       ← Módulo de incidencias
└── ca/                        ← Catalán
    ├── common.json
    ├── auth.json
    ├── inventario.json
    └── incidencias.json
```

---

## Contenido inicial de los ficheros

### `es/common.json`
```json
{
  "app_name": "Eskol",
  "loading": "Cargando...",
  "save": "Guardar",
  "cancel": "Cancelar",
  "delete": "Eliminar",
  "edit": "Editar",
  "create": "Crear",
  "search": "Buscar...",
  "logout": "Cerrar sesión",
  "language": "Idioma",
  "no_results": "No se han encontrado resultados",
  "confirm_delete": "¿Estás seguro de que quieres eliminar este elemento?",
  "error_generic": "Ha ocurrido un error. Inténtalo de nuevo.",
  "nav": {
    "dashboard": "Inicio",
    "inventario": "Inventario",
    "incidencias": "Incidencias",
    "usuarios": "Usuarios",
    "configuracion": "Configuración"
  },
  "roles": {
    "admin": "Administrador",
    "tecnico": "Técnico",
    "pas": "PAS",
    "profesor": "Profesor",
    "alumno": "Alumno"
  }
}
```

### `ca/common.json`
```json
{
  "app_name": "Eskol",
  "loading": "Carregant...",
  "save": "Desar",
  "cancel": "Cancel·lar",
  "delete": "Eliminar",
  "edit": "Editar",
  "create": "Crear",
  "search": "Cerca...",
  "logout": "Tancar sessió",
  "language": "Idioma",
  "no_results": "No s'han trobat resultats",
  "confirm_delete": "Estàs segur que vols eliminar aquest element?",
  "error_generic": "S'ha produït un error. Torna-ho a intentar.",
  "nav": {
    "dashboard": "Inici",
    "inventario": "Inventari",
    "incidencias": "Incidències",
    "usuarios": "Usuaris",
    "configuracion": "Configuració"
  },
  "roles": {
    "admin": "Administrador",
    "tecnico": "Tècnic",
    "pas": "PAS",
    "profesor": "Professor",
    "alumno": "Alumne"
  }
}
```

### `es/auth.json`
```json
{
  "login_title": "Accede a Eskol",
  "username": "Usuario",
  "password": "Contraseña",
  "login_button": "Entrar",
  "logging_in": "Entrando...",
  "error_credentials": "Usuario o contraseña incorrectos",
  "error_server": "No se puede conectar con el servidor",
  "select_language": "Selecciona idioma",
  "forbidden": "No tienes permiso para acceder a esta página"
}
```

### `ca/auth.json`
```json
{
  "login_title": "Accedeix a Eskol",
  "username": "Usuari",
  "password": "Contrasenya",
  "login_button": "Entrar",
  "logging_in": "Entrant...",
  "error_credentials": "Usuari o contrasenya incorrectes",
  "error_server": "No es pot connectar amb el servidor",
  "select_language": "Selecciona idioma",
  "forbidden": "No tens permís per accedir a aquesta pàgina"
}
```

### `es/inventario.json`
```json
{
  "titulo": "Inventario de recursos",
  "subtitulo": "Gestión del material del centro",
  "anadir": "Añadir elemento",
  "espacio": "Espacio",
  "espacios": "Espacios del centro",
  "categoria": "Categoría",
  "estado": "Estado",
  "ubicacion": "Ubicación",
  "codigo_barras": "Código de barras",
  "fotos": "Fotos",
  "hacer_foto": "Hacer foto",
  "escanear": "Escanear código",
  "estados": {
    "disponible": "Disponible",
    "en_uso": "En uso",
    "en_reparacion": "En reparación",
    "de_baja": "De baja",
    "reservado": "Reservado"
  },
  "vista_tarjetas": "Vista tarjetas",
  "vista_tabla": "Vista tabla"
}
```

### `ca/inventario.json`
```json
{
  "titulo": "Inventari de recursos",
  "subtitulo": "Gestió del material del centre",
  "anadir": "Afegir element",
  "espacio": "Espai",
  "espacios": "Espais del centre",
  "categoria": "Categoria",
  "estado": "Estat",
  "ubicacion": "Ubicació",
  "codigo_barras": "Codi de barres",
  "fotos": "Fotos",
  "hacer_foto": "Fer foto",
  "escanear": "Escanejar codi",
  "estados": {
    "disponible": "Disponible",
    "en_uso": "En ús",
    "en_reparacion": "En reparació",
    "de_baja": "De baixa",
    "reservado": "Reservat"
  },
  "vista_tarjetas": "Vista targetes",
  "vista_tabla": "Vista taula"
}
```

---

## Configuración de i18next (`src/i18n.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar todos los ficheros de traducción
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esInventario from './locales/es/inventario.json';
import esIncidencias from './locales/es/incidencias.json';

import caCommon from './locales/ca/common.json';
import caAuth from './locales/ca/auth.json';
import caInventario from './locales/ca/inventario.json';
import caIncidencias from './locales/ca/incidencias.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: esCommon,
        auth: esAuth,
        inventario: esInventario,
        incidencias: esIncidencias,
      },
      ca: {
        common: caCommon,
        auth: caAuth,
        inventario: caInventario,
        incidencias: caIncidencias,
      },
    },
    fallbackLng: 'es',      // Si falta una clave en catalán, usa castellano
    defaultNS: 'common',    // Namespace por defecto
    interpolation: {
      escapeValue: false,   // React ya escapa los valores
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

---

## Uso en componentes

```tsx
// Namespace por defecto (common):
const { t } = useTranslation();
<button>{t('save')}</button>

// Namespace específico:
const { t } = useTranslation('inventario');
<h1>{t('titulo')}</h1>

// Varios namespaces a la vez:
const { t } = useTranslation(['inventario', 'common']);
<h1>{t('inventario:titulo')}</h1>
<button>{t('common:save')}</button>

// Cambiar el idioma desde un botón:
import { useTranslation } from 'react-i18next';
const { i18n } = useTranslation();
<button onClick={() => i18n.changeLanguage('ca')}>Català</button>
<button onClick={() => i18n.changeLanguage('es')}>Castellano</button>
```

---

## Cómo añadir una clave nueva (checklist)

```
1. Añade la clave y el texto en es/{namespace}.json
2. Añade la misma clave traducida en ca/{namespace}.json
3. Usa t('clave') en el componente
4. Comprueba que el cambio de idioma funciona
```

> Si olvidas añadir la clave en catalán, i18next usará automáticamente
> el texto en castellano como fallback (no se rompe nada, pero avisa en consola).

---

## Cómo añadir un idioma nuevo (ej: gallego)

```
1. Crea la carpeta src/locales/gl/
2. Copia los 4 ficheros JSON de es/ y tradúcelos
3. Impórtalos en src/i18n.ts y añádelos al objeto resources
4. Añade el botón en el selector de idioma
```
