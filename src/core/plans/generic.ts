import type { ParsedIframe } from '../../parser';
import { checkIframe } from '../../parser/iframe';
import type { IframePlan, PlanError } from '../plan';

const DEFAULT_RATIO = { width: 16, height: 9 };

/** Re-checks the embed, so a host-built value renders only what `parseIframe` would keep. */
export function genericPlan(embed: ParsedIframe): IframePlan | PlanError {
  const checked = checkIframe(embed);
  if (!checked) {
    return {
      kind: 'error',
      message: 'social-embeds: not a generic iframe embed',
    };
  }
  return {
    kind: 'iframe',
    src: checked.src,
    title: checked.title ?? 'Embedded content',
    allow: checked.allow,
    allowFullscreen: checked.allowFullscreen,
    ...(checked.referrerPolicy
      ? { referrerPolicy: checked.referrerPolicy }
      : {}),
    ...(checked.sandbox === undefined ? {} : { sandbox: checked.sandbox }),
    ...(checked.scrolling ? { scrolling: checked.scrolling } : {}),
    ...layout(checked),
  };
}

// `size` is pixels; `ratio` is a wrapper's padding, so it never sets a width.
function layout({
  size,
  ratio,
}: ParsedIframe): Pick<IframePlan, 'ratio' | 'height' | 'maxWidth'> {
  const { width, height } = size;
  if (width !== undefined && height !== undefined)
    return { ratio: { width, height }, maxWidth: width };
  if (height !== undefined) return { ratio: DEFAULT_RATIO, height };
  return {
    ratio: ratio ?? DEFAULT_RATIO,
    ...(width === undefined ? {} : { maxWidth: width }),
  };
}
