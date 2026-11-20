// Node has no HTMLElement; the stub keeps the export importable.
const Base =
  typeof HTMLElement === 'undefined'
    ? // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      (class {} as typeof HTMLElement)
    : HTMLElement;

export class SocialEmbedElement extends Base {
  connectedCallback(): void {}
}
