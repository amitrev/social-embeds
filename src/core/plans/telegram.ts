import type { ParsedEmbed } from '../../parser';
import { query } from '../params';
import type { MessageHeight, Plan, PlanError } from '../plan';

/** The options of Telegram's post widget configurator (core.telegram.org/widgets/post). */
export type TelegramOptions = {
  /** Show the author's photo. */
  userpic?: boolean;
  /** Accent colour as hex, without `#`. */
  color?: string;
  dark?: boolean;
  /** Accent colour in the dark theme, as hex without `#`. */
  darkColor?: string;
};

// Option names and the query names telegram-widget.js gives them, in its order.
const PARAMS = [
  ['comment', 'comment'],
  ['userpic', 'userpic'],
  ['mode', 'mode'],
  ['single', 'single'],
  ['color', 'color'],
  ['dark', 'dark'],
  ['darkColor', 'dark_color'],
] as const;

// telegram-widget.js passes the attribute as written; `single` is read by presence.
function param(name: string, value: unknown): string | number | undefined {
  if (typeof value === 'boolean') {
    if (name === 'userpic') return String(value);
    if (name === 'single') return value ? 1 : undefined;
    return value ? 1 : 0;
  }
  return typeof value === 'string' || typeof value === 'number'
    ? value
    : undefined;
}

/** docs/decisions.md D49. */
const TELEGRAM_HEIGHT: MessageHeight = {
  origin: 'https://t.me',
  read(data) {
    if (typeof data !== 'string') return undefined;
    const message = JSON.parse(data) as { event?: unknown; height?: unknown };
    return message.event === 'resize' && typeof message.height === 'number'
      ? message.height
      : undefined;
  },
};

/** At most 500px wide by default, the widest the post renders (docs/decisions.md D49). */
export function telegramPlan(
  embed: ParsedEmbed,
  options: TelegramOptions,
): Plan | PlanError {
  const { userpic, color, dark, darkColor } = options;
  const values: Record<string, unknown> = {
    ...embed.options,
    ...(userpic === undefined ? {} : { userpic }),
    ...(color === undefined ? {} : { color }),
    ...(dark === undefined ? {} : { dark }),
    ...(darkColor === undefined ? {} : { darkColor }),
  };
  const params: [string, string | number][] = [['embed', 1]];
  for (const [option, name] of PARAMS) {
    const value = param(name, values[option]);
    if (value !== undefined) params.push([name, value]);
  }
  return {
    kind: 'iframe',
    src: `${embed.url}${query(params)}`,
    title: 'Telegram post',
    allow: '',
    scrolling: 'no',
    ratio: { width: 1, height: 1 },
    messageHeight: TELEGRAM_HEIGHT,
    startHeight: 300,
    maxWidth: 500,
  };
}
