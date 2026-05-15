// api/logout.js
const { clearSessionCookie, getSessionFromRequest } = require('../lib/auth')

module.exports = (req, res) => {
  const session = getSessionFromRequest(req)
  clearSessionCookie(res)
  const slug = session?.clientSlug || ''
  return res.writeHead(302, { Location: slug ? `/${slug}/login` : '/' }).end()
}
