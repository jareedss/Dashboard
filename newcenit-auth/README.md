# newcenit Dashboard — Instrucciones de despliegue

## 1. Requisitos previos
- Cuenta en Vercel (plan Hobby gratuito vale para empezar)
- Node.js instalado localmente
- Vercel CLI: `npm install -g vercel`

---

## 2. Subir el proyecto

```bash
# Entra en la carpeta del proyecto
cd newcenit-dashboard

# Instala dependencias
npm install

# Despliega (primera vez te pedirá login y configurar el proyecto)
vercel
```

Cuando te pregunte:
- **Link to existing project?** → No (crear nuevo)
- **Project name:** → `newcenit-dashboard`
- **Which directory is your code?** → `./` (raíz)
- **Override settings?** → No

---

## 3. Activar Vercel KV

1. Ve a tu proyecto en vercel.com → **Storage** → **Create Database** → **KV**
2. Dale un nombre: `newcenit-kv`
3. Haz click en **Connect to Project** y selecciona tu proyecto
4. Vercel añade automáticamente las variables de entorno `KV_REST_API_URL` y `KV_REST_API_TOKEN`

---

## 4. Variables de entorno manuales

Ve a tu proyecto → **Settings** → **Environment Variables** y añade:

| Variable | Valor | Descripción |
|---|---|---|
| `ADMIN_SECRET` | Una contraseña larga y segura | Para acceder al panel de admin |
| `SESSION_SECRET` | Otra cadena aleatoria larga | Para firmar las sesiones |

Genera valores seguros con: `openssl rand -base64 32`

---

## 5. Configurar dominio

1. Ve a tu proyecto en Vercel → **Settings** → **Domains**
2. Añade: `leads.newcenit.com`
3. En tu registrador de dominio (donde tengas newcenit.com), añade un registro DNS:
   - **Tipo:** CNAME
   - **Nombre:** `leads`
   - **Valor:** `cname.vercel-dns.com`
4. Espera 5-10 minutos a que propague

---

## 6. Volver a desplegar con las variables

```bash
vercel --prod
```

---

## 7. Crear tu primer cliente

Accede al panel de admin:
```
https://leads.newcenit.com/api/admin?adminSecret=TU_ADMIN_SECRET
```

Rellena el formulario:
- **Slug:** `clinica-lopez` (sin espacios, solo minúsculas y guiones)
- **Nombre clínica:** `Clínica Dental López`
- **Usuario:** `lopez`
- **Contraseña temporal:** algo sencillo, ej: `dental2024` (el cliente la cambiará)
- **ID del Google Sheets:** la parte larga de la URL del Sheets del cliente
- **Pestaña:** `LEADS`

---

## 8. Dar acceso al cliente

Envíale por WhatsApp:

> "Ya tienes acceso a tu panel de leads:
> 🔗 https://leads.newcenit.com/clinica-lopez
> Usuario: lopez
> Contraseña temporal: dental2024
> 
> La primera vez te pedirá que crees tu propia contraseña."

---

## 9. Estructura de URLs

| URL | Para quién |
|---|---|
| `leads.newcenit.com/clinica-lopez` | El cliente, su dashboard |
| `leads.newcenit.com/clinica-lopez/login` | Login del cliente |
| `leads.newcenit.com/clinica-lopez/change-password` | Cambiar contraseña (autenticado) |
| `leads.newcenit.com/api/admin?adminSecret=...` | Solo tú, panel de admin |
| `leads.newcenit.com/api/logout` | Cierra sesión |

---

## 10. Añadir más clientes

Repite el paso 7 con un slug diferente por cada cliente. Sin tocar código.

---

## Estructura del proyecto

```
newcenit-dashboard/
├── api/
│   ├── admin.js          ← Panel de admin (crear/listar/borrar clientes)
│   ├── dashboard.js      ← Sirve el dashboard con config inyectada
│   ├── login-page.js     ← Login + primer acceso (cambio forzado de contraseña)
│   ├── change-password.js ← Cambio de contraseña para usuarios activos
│   └── logout.js         ← Cierra sesión
├── lib/
│   └── auth.js           ← KV helpers, bcrypt, cookies
├── public/
│   └── dashboard.html    ← Template del dashboard ({{CLINIC_NAME}} etc. se reemplazan)
├── package.json
└── vercel.json
```
