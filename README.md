# SkillMatch Solidarity API

API REST para conectar estudiantes con skills digitales con ONGs que necesitan apoyo tecnologico. Sistema de matching basado en competencias y niveles de habilidad.

## Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Base de datos:** PostgreSQL (raw SQL, sin ORM)
- **Auth:** argon2 + JWT (cookies httpOnly)
- **Docs:** swagger-jsdoc + Scalar
- **Testing:** Vitest

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crear un archivo `.env` en la raiz del proyecto:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=skillmatch
DB_USER=postgres
DB_PASSWORD=

JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d

DOCS_ENABLED=true
```

### 3. Preparar la base de datos

```bash
# Crear la base de datos
psql -U postgres -d postgres -c "CREATE DATABASE skillmatch;"

# Crear las tablas
psql -U postgres -d skillmatch -f database/tables.sql

# Cargar datos de desarrollo (opcional)
psql -U postgres -d skillmatch -f database/seed.sql
```

El seed incluye: 1 admin, 2 ONGs, 2 estudiantes, 10 skills y 2 proyectos.
Todos los usuarios usan la contraseña `Test1234`.

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor con nodemon (recarga automatica) |
| `npm start` | Servidor en modo produccion |
| `npm test` | Ejecutar todos los tests |
| `npm run test:watch` | Tests en modo watch |

## Endpoints

| Modulo | Base | Descripcion |
|--------|------|-------------|
| Auth | `/auth` | Registro y login |
| Users | `/users` | Perfil generico (GET/PUT /me) |
| Students | `/students` | Perfil y skills del estudiante |
| NGOs | `/ngos` | Perfil de la ONG |
| Projects | `/projects` | CRUD de proyectos y skills requeridas |
| Applications | `/applications` | Postulaciones a proyectos |
| Admin | `/admin` | Gestion de skills (solo admin) |

Documentacion interactiva disponible en `http://localhost:3000/api-docs` (Scalar).

## Estructura del proyecto

```
src/
├── app.js                # Express setup, middleware, rutas
├── server.js             # Entry point
├── config/
│   ├── db.js             # Pool de PostgreSQL
│   └── swagger.js        # Configuracion OpenAPI
├── controllers/          # Parseo HTTP, delegacion al service
├── services/             # Logica de negocio, validaciones
├── repositories/         # Queries SQL parametrizadas
├── routes/               # Definicion de rutas + JSDoc OpenAPI
├── middlewares/
│   └── auth.middleware.js # verifyToken, requireRole
├── utils/
│   └── errors.js         # HttpError
└── tests/                # Tests unitarios (Vitest)

database/
├── tables.sql            # Schema de la base de datos
└── seed.sql              # Datos de desarrollo
```
