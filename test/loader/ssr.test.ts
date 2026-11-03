// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('on the server', () => {
  it('imports without touching window or document', async () => {
    expect(typeof document).toBe('undefined');
    const { loadPlatformScript } =
      await import('../../src/loader/platform-scripts');
    await expect(loadPlatformScript('x')).rejects.toThrow(
      'social-embeds: platform scripts load only in the browser',
    );
  });
});
