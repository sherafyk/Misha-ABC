import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_COOKIE = 'abc_admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 8

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? ''
}

function getPassword() {
  return process.env.ADMIN_ACCESS_PASSWORD ?? ''
}

function sign(payload: string) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
}

export function getAdminSessionCookieName() {
  return SESSION_COOKIE
}

export function validateAdminPassword(password: string) {
  const configured = getPassword()
  return configured.length > 0 && password === configured
}

export function createAdminSessionToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = `admin|${expiresAt}`
  const sig = sign(payload)
  return `${payload}|${sig}`
}

export function isValidAdminSessionToken(token?: string | null) {
  if (!token || !getSessionSecret()) return false

  const parts = token.split('|')
  if (parts.length !== 3) return false

  const [role, expiresAtRaw, providedSig] = parts
  if (role !== 'admin') return false

  const expiresAt = Number.parseInt(expiresAtRaw, 10)
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false

  const expectedSig = sign(`${role}|${expiresAtRaw}`)

  const providedBuffer = Buffer.from(providedSig)
  const expectedBuffer = Buffer.from(expectedSig)

  if (providedBuffer.length !== expectedBuffer.length) return false

  return timingSafeEqual(providedBuffer, expectedBuffer)
}

export function isAdminAuthConfigured() {
  return Boolean(getSessionSecret() && getPassword())
}
