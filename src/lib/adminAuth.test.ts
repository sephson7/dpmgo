// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const secrets: Record<string, string | undefined> = {};

vi.mock('@/lib/serverEnv', () => ({
  readServerSecret: async (name: string) => secrets[name],
}));

const {
  adminCredentials,
  adminPortalConfigured,
  createAdminToken,
  verifyAdminCredentials,
  verifyAdminToken,
} = await import('@/lib/adminAuth');

describe('partner portal fails closed', () => {
  beforeEach(() => {
    for (const key of Object.keys(secrets)) delete secrets[key];
  });

  it('has no default credentials when the secrets are missing', async () => {
    expect(await adminCredentials()).toBeNull();
    expect(await adminPortalConfigured()).toBe(false);
    expect(await verifyAdminCredentials('admin', 'mcautomated')).toBe(false);
    expect(await createAdminToken()).toBeNull();
    expect(await verifyAdminToken('admin.9999999999999.deadbeef')).toBeNull();
  });

  it('stays closed when only part of the configuration is present', async () => {
    secrets['ADMIN_USERNAME'] = 'operator';
    expect(await adminCredentials()).toBeNull();
    expect(await adminPortalConfigured()).toBe(false);

    secrets['ADMIN_PASSWORD'] = 'a-strong-password';
    secrets['ADMIN_SESSION_SECRET'] = 'a-signing-key';
    expect(await adminPortalConfigured()).toBe(true);
  });

  it('does not sign a session without a signing key', async () => {
    secrets['ADMIN_USERNAME'] = 'operator';
    secrets['ADMIN_PASSWORD'] = 'a-strong-password';
    expect(await adminPortalConfigured()).toBe(false);
    expect(await createAdminToken()).toBeNull();
  });
});

describe('partner portal sessions', () => {
  beforeEach(() => {
    secrets['ADMIN_USERNAME'] = 'operator';
    secrets['ADMIN_PASSWORD'] = 'a-strong-password';
    secrets['ADMIN_SESSION_SECRET'] = 'a-signing-key';
  });

  it('accepts the configured credentials and rejects anything else', async () => {
    expect(await verifyAdminCredentials('operator', 'a-strong-password')).toBe(true);
    expect(await verifyAdminCredentials('operator', 'wrong')).toBe(false);
    expect(await verifyAdminCredentials('someone', 'a-strong-password')).toBe(false);
  });

  it('round trips a signed session token', async () => {
    const token = await createAdminToken();
    expect(token).toBeTruthy();
    expect(await verifyAdminToken(token)).toBeGreaterThan(0);
  });

  it('rejects a token signed with another key', async () => {
    const token = await createAdminToken();
    secrets['ADMIN_SESSION_SECRET'] = 'another-signing-key';
    expect(await verifyAdminToken(token)).toBeNull();
  });

  it('rejects a tampered token', async () => {
    const token = (await createAdminToken())!;
    expect(await verifyAdminToken(`${token}x`)).toBeNull();
    expect(await verifyAdminToken('not-a-token')).toBeNull();
    expect(await verifyAdminToken(undefined)).toBeNull();
  });
});
