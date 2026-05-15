// api/login-page.js
const { verifyPassword, setSessionCookie, getSessionFromRequest, getUser, updatePassword } = require('../lib/auth')

function loginHTML(clientSlug, opts = {}) {
  const { error, mustChange, username } = opts
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Acceder — newcenit</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#F7F6F2;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
.card{background:#fff;border:1px solid #E8E5DE;border-radius:16px;padding:40px 36px;width:100%;max-width:380px;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
.logo{font-family:'DM Serif Display',serif;font-size:22px;color:#1A3A2A;text-align:center;margin-bottom:32px;letter-spacing:0.02em}
h1{font-family:'DM Serif Display',serif;font-size:24px;font-weight:400;color:#1A1916;margin-bottom:6px}
.sub{font-size:13px;color:#8A8680;font-weight:300;margin-bottom:28px}
label{font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#8A8680;display:block;margin-bottom:6px}
input{width:100%;padding:10px 14px;border:1px solid #E8E5DE;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;color:#1A1916;outline:none;transition:border .15s;margin-bottom:16px}
input:focus{border-color:#1A3A2A}
.error{background:#FEE2E2;color:#991B1B;font-size:13px;padding:10px 14px;border-radius:8px;margin-bottom:16px}
.success{background:#EDF7EE;color:#2E7D32;font-size:13px;padding:10px 14px;border-radius:8px;margin-bottom:16px}
button{width:100%;padding:12px;background:#1A3A2A;color:white;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:background .15s;margin-top:4px}
button:hover{background:#2d5c41}
.hint{font-size:12px;color:#8A8680;text-align:center;margin-top:20px}
.divider{border:none;border-top:1px solid #E8E5DE;margin:24px 0}
</style>
</head>
<body>
<div class="card">
  <div class="logo">newcenit</div>
  ${mustChange ? `
  <h1>Crea tu contraseña</h1>
  <p class="sub">Es tu primer acceso. Elige una contraseña segura.</p>
  ${error ? `<div class="error">${error}</div>` : ''}
  <form method="POST">
    <input type="hidden" name="action" value="change"/>
    <input type="hidden" name="clientSlug" value="${clientSlug}"/>
    <input type="hidden" name="username" value="${username}"/>
    <label>Nueva contraseña</label>
    <input type="password" name="newPassword" required minlength="8" placeholder="Mínimo 8 caracteres"/>
    <label>Repite la contraseña</label>
    <input type="password" name="confirmPassword" required placeholder="Repite tu contraseña"/>
    <button type="submit">Guardar y acceder</button>
  </form>
  ` : `
  <h1>Bienvenido</h1>
  <p class="sub">Accede a tu panel de leads.</p>
  ${error ? `<div class="error">${error}</div>` : ''}
  <form method="POST">
    <input type="hidden" name="action" value="login"/>
    <input type="hidden" name="clientSlug" value="${clientSlug}"/>
    <label>Usuario</label>
    <input type="text" name="username" required autocomplete="username"/>
    <label>Contraseña</label>
    <input type="password" name="password" required autocomplete="current-password"/>
    <button type="submit">Acceder</button>
  </form>
  <hr class="divider"/>
  <form method="POST">
    <input type="hidden" name="action" value="forgot"/>
    <input type="hidden" name="clientSlug" value="${clientSlug}"/>
    <p class="hint">¿Olvidaste tu contraseña? Escríbenos a <a href="mailto:soporte@newcenit.com" style="color:#1A3A2A">soporte@newcenit.com</a></p>
  </form>
  `}
</div>
</body>
</html>`
}

function changePasswordHTML(clientSlug) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Cambiar contraseña — newcenit</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#F7F6F2;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:#fff;border:1px solid #E8E5DE;border-radius:16px;padding:40px 36px;width:100%;max-width:380px}
.logo{font-family:'DM Serif Display',serif;font-size:22px;color:#1A3A2A;text-align:center;margin-bottom:32px}
h1{font-family:'DM Serif Display',serif;font-size:24px;font-weight:400;color:#1A1916;margin-bottom:6px}
.sub{font-size:13px;color:#8A8680;font-weight:300;margin-bottom:28px}
label{font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#8A8680;display:block;margin-bottom:6px}
input{width:100%;padding:10px 14px;border:1px solid #E8E5DE;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border .15s;margin-bottom:16px}
input:focus{border-color:#1A3A2A}
.error{background:#FEE2E2;color:#991B1B;font-size:13px;padding:10px 14px;border-radius:8px;margin-bottom:16px}
button{width:100%;padding:12px;background:#1A3A2A;color:white;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer}
.back{display:block;text-align:center;margin-top:16px;font-size:13px;color:#8A8680;text-decoration:none}
.back:hover{color:#1A3A2A}
</style>
</head>
<body>
<div class="card">
  <div class="logo">newcenit</div>
  <h1>Cambiar contraseña</h1>
  <p class="sub">Elige una nueva contraseña para tu cuenta.</p>
  <div id="msg"></div>
  <form id="form">
    <input type="hidden" name="clientSlug" value="${clientSlug}"/>
    <label>Contraseña actual</label>
    <input type="password" name="currentPassword" required/>
    <label>Nueva contraseña</label>
    <input type="password" name="newPassword" required minlength="8"/>
    <label>Repite la nueva contraseña</label>
    <input type="password" name="confirmPassword" required/>
    <button type="submit">Guardar contraseña</button>
  </form>
  <a class="back" href="/${clientSlug}">← Volver al panel</a>
</div>
<script>
document.getElementById('form').addEventListener('submit', async e => {
  e.preventDefault()
  const fd = new FormData(e.target)
  const np = fd.get('newPassword'), cp = fd.get('confirmPassword')
  if (np !== cp) { document.getElementById('msg').innerHTML = '<div style="background:#FEE2E2;color:#991B1B;font-size:13px;padding:10px 14px;border-radius:8px;margin-bottom:16px">Las contraseñas no coinciden.</div>'; return }
  const res = await fetch('/api/change-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ clientSlug: fd.get('clientSlug'), currentPassword: fd.get('currentPassword'), newPassword: np }) })
  const data = await res.json()
  if (data.ok) {
    document.getElementById('msg').innerHTML = '<div style="background:#EDF7EE;color:#2E7D32;font-size:13px;padding:10px 14px;border-radius:8px;margin-bottom:16px">Contraseña actualizada correctamente.</div>'
    setTimeout(() => location.href = '/${clientSlug}', 1500)
  } else {
    document.getElementById('msg').innerHTML = '<div style="background:#FEE2E2;color:#991B1B;font-size:13px;padding:10px 14px;border-radius:8px;margin-bottom:16px">' + (data.error || 'Error') + '</div>'
  }
})
</script>
</body>
</html>`
}

module.exports = async (req, res) => {
  const clientSlug = req.query.client

  if (!clientSlug) {
    return res.status(400).send('Missing client')
  }

  // Handle change-password page (GET)
  if (req.url && req.url.includes('change-password')) {
    return res.setHeader('Content-Type', 'text/html').send(changePasswordHTML(clientSlug))
  }

  // GET — show login form
  if (req.method === 'GET') {
    const user = await getUser(clientSlug)
    if (!user) return res.status(404).send('Clínica no encontrada.')
    return res.setHeader('Content-Type', 'text/html').send(loginHTML(clientSlug))
  }

  // POST — handle login or first-time password change
  if (req.method === 'POST') {
    let body = ''
    await new Promise(resolve => {
      req.on('data', chunk => body += chunk)
      req.on('end', resolve)
    })
    const params = new URLSearchParams(body)
    const action = params.get('action')
    const slug = params.get('clientSlug') || clientSlug

    if (action === 'login') {
      const username = params.get('username')
      const password = params.get('password')
      const result = await verifyPassword(slug, password)

      if (!result.ok) {
        return res.setHeader('Content-Type', 'text/html').send(
          loginHTML(slug, { error: 'Usuario o contraseña incorrectos.' })
        )
      }

      if (result.user.mustChangePassword) {
        return res.setHeader('Content-Type', 'text/html').send(
          loginHTML(slug, { mustChange: true, username: result.user.username })
        )
      }

      setSessionCookie(res, slug, username)
      return res.writeHead(302, { Location: `/${slug}` }).end()
    }

    if (action === 'change') {
      const username = params.get('username')
      const newPassword = params.get('newPassword')
      const confirmPassword = params.get('confirmPassword')

      if (newPassword !== confirmPassword) {
        return res.setHeader('Content-Type', 'text/html').send(
          loginHTML(slug, { mustChange: true, username, error: 'Las contraseñas no coinciden.' })
        )
      }
      if (newPassword.length < 8) {
        return res.setHeader('Content-Type', 'text/html').send(
          loginHTML(slug, { mustChange: true, username, error: 'La contraseña debe tener al menos 8 caracteres.' })
        )
      }

      await updatePassword(slug, newPassword)
      setSessionCookie(res, slug, username)
      return res.writeHead(302, { Location: `/${slug}` }).end()
    }
  }

  return res.status(405).send('Method not allowed')
}
