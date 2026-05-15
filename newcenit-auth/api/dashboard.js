// api/dashboard.js
const { getSessionFromRequest, getUser } = require('../lib/auth')
const fs = require('fs')
const path = require('path')

module.exports = async (req, res) => {
  const clientSlug = req.query.client

  if (!clientSlug) return res.status(400).send('Missing client')

  // Verify session
  const session = getSessionFromRequest(req)
  if (!session || session.clientSlug !== clientSlug) {
    return res.writeHead(302, { Location: `/${clientSlug}/login` }).end()
  }

  // Load client config from KV
  const user = await getUser(clientSlug)
  if (!user) return res.status(404).send('Clínica no encontrada.')

  // Read dashboard template
  const templatePath = path.join(__dirname, '../public/dashboard.html')
  let html = fs.readFileSync(templatePath, 'utf8')

  // Inject client-specific config
  html = html
    .replace(/\{\{CLINIC_NAME\}\}/g, user.clinicName)
    .replace(/\{\{SHEET_ID\}\}/g, user.sheetId)
    .replace(/\{\{SHEET_TAB\}\}/g, user.sheetTab || 'LEADS')
    .replace(/\{\{CLIENT_SLUG\}\}/g, clientSlug)

  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 'no-store')
  return res.send(html)
}
