// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

async function activate(fail: boolean) {
  const listeners = new Map<string, (event: { waitUntil: (task: Promise<void>) => void }) => void>();
  const unregister = vi.fn().mockResolvedValue(true);
  const remove = vi.fn().mockResolvedValue(true);
  const navigate = vi.fn().mockResolvedValue(undefined);
  const keys = fail
    ? vi.fn().mockRejectedValue(new Error('cache unavailable'))
    : vi.fn().mockResolvedValue([
        'dpmgo-shell-dpmgo-v2',
        'dpmgo-assets-dpmgo-v1',
        'dpmgo-fonts-dpmgo-v2',
        'firebase-messaging',
        'onesignal',
        'unrelated-runtime',
      ]);
  runInNewContext(readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8'), {
    self: {
      registration: { scope: 'https://dpmgo.app/', unregister },
      addEventListener: (name: string, handler: typeof listeners extends Map<string, infer T> ? T : never) => listeners.set(name, handler),
      clients: {
        claim: vi.fn().mockResolvedValue(undefined),
        matchAll: vi.fn().mockResolvedValue([{ url: 'https://dpmgo.app/', navigate }]),
      },
    },
    caches: { keys, delete: remove },
  });
  let activation: Promise<void> | undefined;
  listeners.get('activate')?.({ waitUntil: (task) => { activation = task; } });
  if (!activation) throw new Error('Missing activation handler');
  await activation.catch(() => {});
  return { unregister, remove, navigate };
}

describe('deployed stale-cache cleanup', () => {
  it('removes only app caches and refreshes returning windows', async () => {
    const { unregister, remove, navigate } = await activate(false);
    expect(remove.mock.calls.map(([name]) => name)).toEqual([
      'dpmgo-shell-dpmgo-v2', 'dpmgo-assets-dpmgo-v1', 'dpmgo-fonts-dpmgo-v2',
    ]);
    expect(navigate).toHaveBeenCalledWith('https://dpmgo.app/');
    expect(unregister).toHaveBeenCalledOnce();
  });
  it('unregisters even if cache storage fails', async () => {
    const { unregister } = await activate(true);
    expect(unregister).toHaveBeenCalledOnce();
  });
});