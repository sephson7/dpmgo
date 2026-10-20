// Basic admin session handling for the anchor slot portal.
import { readServerSecret } from './serverEnv';

export const ADMIN_COOKIE = 'dpm_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export type AdminCredentials = { username: string; password: string };

export async function adminCredentials(
  context?: unknown
): Promise<AdminCredentials> {
  const username = (await readServerSecret('ADMIN_USERNAME', context)) ?? 'admin';
  const password = (await readServerSecret('ADMIN_PASSWORD', context)) ?? 'mcautomated';
  return { username, password };
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
  context?: unknown
): Promise<boolean> {
  const expected = await adminCredentials(context);
  return timingSafeEqual(username, expected.username) && timingSafeEqual(password, expected.password);
}

async function sessionSecret(context?: unknown): Promise<string> {
  const explicit = await readServerSecret('ADMIN_SESSION_SECRET', context);
  if (explicit) return explicit;
  const { password } = await adminCredentials(context);
  return `dpm-admin-${password}`;
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Creates a signed, time limited session token. */
export async function createAdminToken(context?: unknown): Promise<string> {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${expires}`;
  const signature = await hmac(payload, await sessionSecret(context));
  return `${payload}.${signature}`;
}

/** Validates a session token and returns the remaining lifetime in ms. */
export async function verifyAdminToken(
  token: string | undefined | null,
  context?: unknown
): Promise<number | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const role = parts[0] ?? '';
  const expiresRaw = parts[1] ?? '';
  const signature = parts[2] ?? '';
  if (role !== 'admin') return null;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now()) return null;
  const expected = await hmac(`admin.${expiresRaw}`, await sessionSecret(context));
  if (!timingSafeEqual(signature, expected)) return null;
  return expires - Date.now();
}

/** Reads the session cookie out of a request. */
export function readAdminCookie(request: Request): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === ADMIN_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/** Builds the Set-Cookie header for an admin session. */
export function adminCookie(token: string, secure: boolean): string {
  const attributes = [
    `${ADMIN_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

/** Builds the Set-Cookie header that clears the admin session. */
export function clearAdminCookie(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
