// api/change-password.js
const { getSessionFromRequest, verifyPassword, updatePassword } = require('../lib/auth')

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const session = getSessionFromRequest(req)
  if (!session) return res.status(401).json({ error: 'No autenticado' })

  let body = ''
  await new Promise(resolve => { req.on('data', c => body += c); req.on('end', resolve) })
  const { clientSlug, currentPassword, newPassword } = JSON.parse(body)

  if (session.clientSlug !== clientSlug) {
    return res.status(403).json({ error: 'No autorizado' })
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' })
  }

  const result = await verifyPassword(clientSlug, currentPassword)
  if (!result.ok) {
    return res.status(401).json({ error: 'La contraseña actual es incorrecta.' })
  }

  await updatePassword(clientSlug, newPassword)
  return res.status(200).json({ ok: true })
}
