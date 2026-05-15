// lib/auth.js
// Requires env vars: KV_REST_API_URL, KV_REST_API_TOKEN (auto-set by Vercel KV)
// and ADMIN_SECRET (set manually in Vercel dashboard)

const bcrypt = require('bcryptjs')
const cookie = require('cookie')

// ── KV helpers (raw REST, no SDK needed) ──────────────────────────────────────
async function kvGet(key) {
  const res = await fetch(`${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
  })
  const data = await res.json()
  return data.result ? JSON.parse(data.result) : null
}

async function kvSet(key, value) {
  await fetch(`${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ value: JSON.stringify(value) })
  })
}

async function kvDel(key) {
  await fetch(`${process.env.KV_REST_API_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
  })
}

async function kvKeys(pattern) {
  const res = await fetch(`${process.env.KV_REST_API_URL}/keys/${encodeURIComponent(pattern)}`, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
  })
  const data = await res.json()
  return data.result || []
}

// ── User schema in KV ─────────────────────────────────────────────────────────
// Key: user:{clientSlug}
// Value: { username, passwordHash, clinicName, sheetId, sheetTab, createdAt }

async function getUser(clientSlug) {
  return await kvGet(`user:${clientSlug}`)
}

async function createUser({ clientSlug, username, plainPassword, clinicName, sheetId, sheetTab }) {
  const passwordHash = await bcrypt.hash(plainPassword, 10)
  await kvSet(`user:${clientSlug}`, {
    username,
    passwordHash,
    clinicName,
    sheetId,
    sheetTab: sheetTab || 'LEADS',
    createdAt: new Date().toISOString(),
    mustChangePassword: true  // forces client to change on first login
  })
}

async function updatePassword(clientSlug, newPlainPassword) {
  const user = await getUser(clientSlug)
  if (!user) throw new Error('User not found')
  user.passwordHash = await bcrypt.hash(newPlainPassword, 10)
  user.mustChangePassword = false
  await kvSet(`user:${clientSlug}`, user)
}

async function verifyPassword(clientSlug, plainPassword) {
  const user = await getUser(clientSlug)
  if (!user) return { ok: false, reason: 'not_found' }
  const match = await bcrypt.compare(plainPassword, user.passwordHash)
  if (!match) return { ok: false, reason: 'wrong_password' }
  return { ok: true, user }
}

async function listUsers() {
  const keys = await kvKeys('user:*')
  const users = await Promise.all(keys.map(async k => {
    const u = await kvGet(k)
    const slug = k.replace('user:', '')
    return { slug, username: u.username, clinicName: u.clinicName, createdAt: u.createdAt, mustChangePassword: u.mustChangePassword }
  }))
  return users
}

async function deleteUser(clientSlug) {
  await kvDel(`user:${clientSlug}`)
}

// ── Session cookie ────────────────────────────────────────────────────────────
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret'
const COOKIE_NAME = 'nc_session'

function makeSessionToken(clientSlug, username) {
  // Simple HMAC-less token for MVP — slug:username:timestamp base64
  // For production upgrade to JWT with jose library
  const payload = JSON.stringify({ clientSlug, username, ts: Date.now() })
  return Buffer.from(payload).toString('base64url')
}

function parseSessionToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString())
    // Expire after 30 days
    if (Date.now() - payload.ts > 30 * 24 * 60 * 60 * 1000) return null
    return payload
  } catch { return null }
}

function setSessionCookie(res, clientSlug, username) {
  const token = makeSessionToken(clientSlug, username)
  const c = cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/'
  })
  res.setHeader('Set-Cookie', c)
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', { maxAge: 0, path: '/' }))
}

function getSessionFromRequest(req) {
  const cookies = cookie.parse(req.headers.cookie || '')
  const token = cookies[COOKIE_NAME]
  if (!token) return null
  return parseSessionToken(token)
}

// ── Admin check ───────────────────────────────────────────────────────────────
function isAdmin(req) {
  const secret = req.headers['x-admin-secret'] || req.query?.adminSecret
  return secret === process.env.ADMIN_SECRET
}

module.exports = {
  getUser, createUser, updatePassword, verifyPassword, listUsers, deleteUser,
  setSessionCookie, clearSessionCookie, getSessionFromRequest,
  isAdmin
}
