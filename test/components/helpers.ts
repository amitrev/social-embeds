import { act } from '@testing-library/react';
import { vi } from 'vitest';

/** A controllable IntersectionObserver: tests decide when an element comes into view. */
export class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly targets: Element[] = [];

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.targets.push(target);
  }

  unobserve() {}

  disconnect() {
    this.targets.length = 0;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Reports every observed element as intersecting. */
  enter() {
    const entries = this.targets.map(
      (target) =>
        ({ isIntersecting: true, target }) as IntersectionObserverEntry,
    );
    act(() => {
      this.callback(entries, this as unknown as IntersectionObserver);
    });
  }
}

export function installObserver() {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
}

export function lastObserver(): FakeIntersectionObserver {
  const observer = FakeIntersectionObserver.instances.at(-1);
  if (!observer) throw new Error('no IntersectionObserver was created');
  return observer;
}
