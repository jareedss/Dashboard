// api/admin.js
// Protegido con ADMIN_SECRET en header o query param
// Uso: GET  /api/admin?adminSecret=TU_SECRET
//      POST /api/admin?adminSecret=TU_SECRET  { action, ...params }

const { isAdmin, createUser, listUsers, deleteUser } = require('../lib/auth')

function adminHTML(users) {
  const rows = users.map(u => `
    <tr>
      <td>${u.slug}</td>
      <td>${u.clinicName}</td>
      <td>${u.username}</td>
      <td>${u.mustChangePassword ? '⚠️ Pendiente' : '✅ Configurada'}</td>
      <td>${new Date(u.createdAt).toLocaleDateString('es-ES')}</td>
      <td>
        <a href="/${u.slug}" target="_blank" style="color:#1A3A2A;font-size:12px">Ver panel</a>
        &nbsp;·&nbsp;
        <a href="#" onclick="deleteClient('${u.slug}')" style="color:#991B1B;font-size:12px">Eliminar</a>
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Admin — newcenit</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#F7F6F2;padding:32px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px}
.logo{font-family:'DM Serif Display',serif;font-size:26px;color:#1A3A2A}
h2{font-size:18px;font-weight:500;color:#1A1916;margin-bottom:20px}
.card{background:#fff;border:1px solid #E8E5DE;border-radius:12px;padding:28px;margin-bottom:24px}
label{font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#8A8680;display:block;margin-bottom:5px}
input{width:100%;padding:9px 12px;border:1px solid #E8E5DE;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;margin-bottom:14px}
input:focus{border-color:#1A3A2A}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}
button{padding:10px 20px;background:#1A3A2A;color:white;border:none;border-radius:7px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer}
button:hover{background:#2d5c41}
table{width:100%;border-collapse:collapse;font-size:13px}
thead th{padding:10px 12px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#8A8680;border-bottom:1px solid #E8E5DE;background:#FAFAF8}
tbody td{padding:12px;border-bottom:1px solid #F0EDE6}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover{background:#FAFAF8}
.msg{padding:10px 14px;border-radius:7px;font-size:13px;margin-bottom:16px}
.msg.ok{background:#EDF7EE;color:#2E7D32}
.msg.err{background:#FEE2E2;color:#991B1B}
.hint{font-size:11px;color:#8A8680;margin-top:-10px;margin-bottom:14px}
</style>
</head>
<body>
<div class="header">
  <div class="logo">newcenit — Admin</div>
  <span style="font-size:12px;color:#8A8680">${users.length} cliente${users.length !== 1 ? 's' : ''} activo${users.length !== 1 ? 's' : ''}</span>
</div>

<div class="card">
  <h2>Crear nuevo cliente</h2>
  <div id="create-msg"></div>
  <div class="grid">
    <div>
      <label>Slug del cliente</label>
      <input id="clientSlug" placeholder="ej: clinica-lopez" oninput="updateUrl()"/>
      <p class="hint">Solo minúsculas y guiones. URL: leads.newcenit.com/<span id="slug-preview" style="color:#1A3A2A">clinica-lopez</span></p>
    </div>
    <div>
      <label>Nombre de la clínica</label>
      <input id="clinicName" placeholder="ej: Clínica Dental López"/>
    </div>
    <div>
      <label>Usuario (para login)</label>
      <input id="username" placeholder="ej: lopez"/>
    </div>
    <div>
      <label>Contraseña temporal</label>
      <input id="password" type="text" placeholder="Se la darás al cliente"/>
      <p class="hint">El cliente deberá cambiarla en el primer acceso.</p>
    </div>
    <div>
      <label>ID del Google Sheets</label>
      <input id="sheetId" placeholder="1xA7h..."/>
      <p class="hint">La parte larga de la URL del Sheets.</p>
    </div>
    <div>
      <label>Nombre de la pestaña</label>
      <input id="sheetTab" value="LEADS"/>
    </div>
  </div>
  <button onclick="createClient()">Crear cliente</button>
</div>

<div class="card">
  <h2>Clientes activos</h2>
  <table>
    <thead>
      <tr>
        <th>Slug</th>
        <th>Clínica</th>
        <th>Usuario</th>
        <th>Contraseña</th>
        <th>Alta</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody id="clients-tbody">
      ${rows || '<tr><td colspan="6" style="text-align:center;color:#8A8680;padding:24px">Sin clientes todavía.</td></tr>'}
    </tbody>
  </table>
</div>

<script>
const adminSecret = new URLSearchParams(location.search).get('adminSecret')

function updateUrl() {
  document.getElementById('slug-preview').textContent = document.getElementById('clientSlug').value || 'slug'
}

async function createClient() {
  const payload = {
    action: 'create',
    clientSlug:  document.getElementById('clientSlug').value.trim(),
    clinicName:  document.getElementById('clinicName').value.trim(),
    username:    document.getElementById('username').value.trim(),
    plainPassword: document.getElementById('password').value.trim(),
    sheetId:     document.getElementById('sheetId').value.trim(),
    sheetTab:    document.getElementById('sheetTab').value.trim() || 'LEADS'
  }
  if (!payload.clientSlug || !payload.clinicName || !payload.username || !payload.plainPassword || !payload.sheetId) {
    showMsg('create-msg', 'Rellena todos los campos.', 'err'); return
  }
  const res = await fetch('/api/admin?adminSecret=' + adminSecret, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  if (data.ok) {
    showMsg('create-msg', '✅ Cliente creado. URL: leads.newcenit.com/' + payload.clientSlug, 'ok')
    setTimeout(() => location.reload(), 2000)
  } else {
    showMsg('create-msg', data.error || 'Error al crear cliente.', 'err')
  }
}

async function deleteClient(slug) {
  if (!confirm('¿Seguro que quieres eliminar ' + slug + '? Esto borra el acceso, no los datos de Sheets.')) return
  const res = await fetch('/api/admin?adminSecret=' + adminSecret, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', clientSlug: slug })
  })
  const data = await res.json()
  if (data.ok) location.reload()
  else alert(data.error || 'Error')
}

function showMsg(id, text, type) {
  const el = document.getElementById(id)
  el.innerHTML = '<div class="msg ' + type + '">' + text + '</div>'
  setTimeout(() => el.innerHTML = '', 5000)
}
</script>
</body>
</html>`
}

module.exports = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).send('No autorizado. Añade ?adminSecret=TU_SECRET a la URL.')
  }

  if (req.method === 'GET') {
    const users = await listUsers()
    return res.setHeader('Content-Type', 'text/html').send(adminHTML(users))
  }

  if (req.method === 'POST') {
    let body = ''
    await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve) })
    const data = JSON.parse(body)

    if (data.action === 'create') {
      const { clientSlug, clinicName, username, plainPassword, sheetId, sheetTab } = data
      if (!clientSlug || !clinicName || !username || !plainPassword || !sheetId) {
        return res.status(400).json({ error: 'Faltan campos.' })
      }
      if (!/^[a-z0-9-]+$/.test(clientSlug)) {
        return res.status(400).json({ error: 'El slug solo puede contener minúsculas y guiones.' })
      }
      await createUser({ clientSlug, username, plainPassword, clinicName, sheetId, sheetTab })
      return res.json({ ok: true })
    }

    if (data.action === 'delete') {
      await deleteUser(data.clientSlug)
      return res.json({ ok: true })
    }

    return res.status(400).json({ error: 'Acción desconocida.' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
