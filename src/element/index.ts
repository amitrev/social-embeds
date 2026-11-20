import { SocialEmbedElement } from './social-embed-element';

export { SocialEmbedElement };

if (
  typeof customElements !== 'undefined' &&
  !customElements.get('social-embed')
) {
  customElements.define('social-embed', SocialEmbedElement);
}

declare global {
  interface HTMLElementTagNameMap {
    'social-embed': SocialEmbedElement;
  }
}
