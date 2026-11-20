import { expect, it, vi } from 'vitest';
import { SocialEmbedElement } from '../../src/element';

it('defines social-embed', () => {
  expect(customElements.get('social-embed')).toBe(SocialEmbedElement);
  expect(document.createElement('social-embed')).toBeInstanceOf(
    SocialEmbedElement,
  );
});

it('survives a second copy of the module', async () => {
  vi.resetModules();
  await expect(import('../../src/element')).resolves.toBeDefined();
});
