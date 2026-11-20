import { describe, expect, it } from 'vitest';
import type { IframePlan } from '../../src/core/plan';
import { frameStyle } from '../../src/core/layout';

const plan = (extra: Partial<IframePlan> = {}): IframePlan => ({
  kind: 'iframe',
  src: 'https://example.com/embed',
  title: 'Example',
  allow: '',
  ratio: { width: 16, height: 9 },
  ...extra,
});

const message = {
  origin: 'https://example.com',
  read: () => undefined,
};

describe('frameStyle', () => {
  it('uses the plan height as a fixed height, which the layout replaces', () => {
    expect(frameStyle(plan({ height: 670 }), {})).toEqual({
      position: 'relative',
      width: '100%',
      maxWidth: undefined,
      height: 670,
      maxHeight: undefined,
    });
    expect(frameStyle(plan({ height: 670 }), { height: 400 })).toMatchObject({
      height: 400,
    });
  });

  it('rounds the corners and clips only when the plan has a radius', () => {
    expect(frameStyle(plan({ borderRadius: 12 }), {})).toMatchObject({
      borderRadius: 12,
      overflow: 'hidden',
    });
    const plain = frameStyle(plan(), {});
    expect(plain).not.toHaveProperty('borderRadius');
    expect(plain).not.toHaveProperty('overflow');
  });

  it('uses the ratio and full width by default', () => {
    expect(frameStyle(plan(), {})).toEqual({
      position: 'relative',
      width: '100%',
      maxWidth: undefined,
      aspectRatio: '16 / 9',
    });
  });

  it('lets the input size override the ratio', () => {
    expect(frameStyle(plan({ size: { width: 560, height: 315 } }), {})).toEqual(
      {
        position: 'relative',
        width: '100%',
        maxWidth: undefined,
        aspectRatio: '560 / 315',
      },
    );
  });

  it('uses a fixed height instead of the ratio', () => {
    const style = frameStyle(plan(), { height: 400, maxHeight: 600 });
    expect(style).toMatchObject({ height: 400, maxHeight: 600 });
    expect(style).not.toHaveProperty('aspectRatio');
  });

  it('turns maxHeight into a width limit', () => {
    expect(frameStyle(plan(), { maxHeight: 360 })).toMatchObject({
      maxWidth: 640,
    });
    expect(frameStyle(plan(), { maxHeight: 360, maxWidth: 500 })).toMatchObject(
      { maxWidth: 500 },
    );
  });

  it('sizes from messages', () => {
    const messaged = plan({ messageHeight: message, startHeight: 300 });
    expect(frameStyle(messaged, {})).toMatchObject({ height: 300 });
    expect(frameStyle(messaged, {}, 812)).toMatchObject({ height: 812 });
  });

  it('takes maxWidth from the plan unless the layout sets one', () => {
    expect(frameStyle(plan({ maxWidth: 325 }), {})).toMatchObject({
      maxWidth: 325,
    });
    expect(
      frameStyle(plan({ maxWidth: 325 }), { maxWidth: 400 }),
    ).toMatchObject({ maxWidth: 400 });
  });
});
