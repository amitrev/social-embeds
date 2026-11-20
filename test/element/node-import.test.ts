import { expect, it } from 'vitest';

it('imports in Node without defining anything', async () => {
  const mod = await import('../../src/element');
  expect(typeof mod.SocialEmbedElement).toBe('function');
  expect(globalThis.customElements).toBeUndefined();
});
