import { describe, expect, it } from 'vitest';
import { matchUrl, parseEmbed } from '../../src/parser';
import { verifyEmbed } from '../../src/parser/verify';
import route from '../fixtures/strava/route-derived.html?raw';

const ROUTE = '3247927232574435836';
const base = { platform: 'strava', kind: 'post', variant: 'iframe' } as const;
const routeEmbed = {
  ...base,
  url: `https://www.strava.com/routes/${ROUTE}`,
  id: `route/${ROUTE}`,
} as const;
const activity = route
  .replace('data-embed-type="route"', 'data-embed-type="activity"')
  .replace(ROUTE, '12345');

describe('Strava embed code', () => {
  it('parses the route placeholder with its style', () => {
    expect(parseEmbed(route)).toEqual({
      ...routeEmbed,
      options: { style: 'standard' },
    });
  });

  it('parses an activity', () => {
    expect(parseEmbed(activity)).toEqual({
      ...base,
      url: 'https://www.strava.com/activities/12345',
      id: 'activity/12345',
      options: { style: 'standard' },
    });
  });

  it('never turns the type or the id into options (D68)', () => {
    const options = parseEmbed(route)?.options ?? {};
    expect(options).not.toHaveProperty('embedType');
    expect(options).not.toHaveProperty('embedId');
  });

  it('reads the older single-quoted form without a style', () => {
    const html = `<div class='strava-embed-placeholder' data-embed-type='activity' data-embed-id='12345'></div><script src='https://strava-embeds.com/embed.js'></script>`;
    expect(parseEmbed(html)).toMatchObject({
      id: 'activity/12345',
      options: {},
    });
  });

  it('keeps the minimal style, full width and the map hash', () => {
    const html = route.replace(
      'data-style="standard"',
      'data-style="minimal" data-full-width="true" data-map-hash="a1b2-c3"',
    );
    expect(parseEmbed(html)?.options).toEqual({
      style: 'minimal',
      fullWidth: true,
      mapHash: 'a1b2-c3',
    });
  });

  it('drops fromEmbed, an unknown style and a full width of false', () => {
    const html = route.replace(
      'data-style="standard"',
      'data-style="neon" data-full-width="false"',
    );
    expect(parseEmbed(html)?.options).toEqual({});
    expect(parseEmbed(route)?.options).not.toHaveProperty('fromEmbed');
  });

  it('drops full width on an activity', () => {
    const html = activity.replace(
      'data-style',
      'data-full-width="true" data-style',
    );
    expect(parseEmbed(html)?.options).toEqual({ style: 'standard' });
  });

  it('passes verifyEmbed', () => {
    for (const html of [route, activity]) {
      const embed = parseEmbed(html);
      expect(embed && verifyEmbed(embed)).toEqual(embed);
    }
  });

  it.each([
    [
      'segments',
      route.replace('data-embed-type="route"', 'data-embed-type="segment"'),
    ],
    ['a missing id', route.replace(` data-embed-id="${ROUTE}"`, '')],
    ['a non-numeric id', route.replace(ROUTE, '12a')],
    ['a foreign script', route.replace('strava-embeds.com', 'example.com')],
    ['content in the placeholder', route.replace('></div>', '>x</div>')],
    ['another class', route.replace('strava-embed-placeholder', 'other')],
  ])('rejects %s', (_, html) => {
    expect(parseEmbed(html)).toBeNull();
  });
});

describe('Strava URLs', () => {
  it.each([
    [`https://www.strava.com/routes/${ROUTE}`, routeEmbed],
    [`https://strava.com/routes/${ROUTE}`, routeEmbed],
    [
      'https://www.strava.com/activities/12345',
      {
        ...base,
        url: 'https://www.strava.com/activities/12345',
        id: 'activity/12345',
      },
    ],
  ])('matches %s', (url, expected) => {
    expect(matchUrl(url)).toEqual({ ...expected, options: {} });
  });

  it.each([
    'https://strava.app.link/abc123',
    'https://www.strava.com/segments/1',
    'https://www.strava.com/athletes/1',
    'https://www.strava.com/activities/abc',
    'https://www.strava.com/activities/',
  ])('does not match %s', (url) => {
    expect(matchUrl(url)).toBeNull();
  });
});
