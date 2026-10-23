import { describe, expect, it } from 'vitest';
import { isAppWorker, refusesAppWorker } from './appWorker';

describe('app cache cleanup boundaries', () => {
  it('refuses development, iframe previews and the manual kill switch', () => {
    expect(refusesAppWorker(false, 'dpmgo.app', false, '')).toBe(true);
    expect(refusesAppWorker(true, 'dpmgo.app', true, '')).toBe(true);
    expect(refusesAppWorker(true, 'dpmgo.app', false, '?sw=off')).toBe(true);
  });
  it('refuses main, draft, commit and workspace previews on platform domains', () => {
    for (const host of [
      'id-preview--247f0bf3-491c-5d0c-b483-30208cfabc7d.lovable.app',
      'preview-v2--example.gpt-eng.com',
      'preview--example.gptengineer.run',
      'project--example-dev.lovable.app',
      'example.lovableproject.com',
      'example.lovableproject-dev.com',
      'example.beta.lovable.dev',
    ]) expect(refusesAppWorker(true, host, false, '')).toBe(true);
  });
  it('keeps published and custom domains eligible', () => {
    for (const host of ['dpmgo.app', 'www.dpmgo.app', 'dpmgo.lovable.app', 'preview-v2--shop.example.com']) {
      expect(refusesAppWorker(true, host, false, '')).toBe(false);
    }
  });
  it('targets only same-origin app workers, never messaging workers', () => {
    expect(isAppWorker('https://dpmgo.app/sw.js', 'https://dpmgo.app')).toBe(true);
    expect(isAppWorker('/service-worker.js', 'https://dpmgo.app')).toBe(true);
    expect(isAppWorker('/firebase-messaging-sw.js', 'https://dpmgo.app')).toBe(false);
    expect(isAppWorker('/OneSignalSDKWorker.js', 'https://dpmgo.app')).toBe(false);
    expect(isAppWorker('https://other.example/sw.js', 'https://dpmgo.app')).toBe(false);
  });
});