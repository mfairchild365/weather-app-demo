import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { announce, resetAnnouncer } from './announcer';

function politeRegion(): HTMLElement | null {
  return document.querySelector('[data-announcer="polite"]');
}

function assertiveRegion(): HTMLElement | null {
  return document.querySelector('[data-announcer="assertive"]');
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  resetAnnouncer();
  vi.useRealTimers();
});

describe('announce', () => {
  it('injects a polite (role="status") and an assertive (role="alert") region, both empty, on first call', () => {
    expect(politeRegion()).toBeNull();
    expect(assertiveRegion()).toBeNull();

    announce('Hello');

    const polite = politeRegion();
    const assertive = assertiveRegion();
    expect(polite).not.toBeNull();
    expect(assertive).not.toBeNull();
    expect(polite).toHaveAttribute('role', 'status');
    expect(assertive).toHaveAttribute('role', 'alert');
    // The assertive region wasn't the target of this call, so it stays empty.
    expect(assertive).toHaveTextContent('');
  });

  it('does not re-inject regions on subsequent calls', () => {
    announce('First');
    const polite = politeRegion();
    announce('Second');
    expect(politeRegion()).toBe(polite);
    expect(document.querySelectorAll('[data-announcer]')).toHaveLength(2);
  });

  it('writes a polite message to the polite region', () => {
    announce('12 cities');
    expect(politeRegion()).toHaveTextContent('12 cities');
  });

  it('writes an assertive message to the assertive region', () => {
    announce('Load failed', 'assertive');
    expect(assertiveRegion()).toHaveTextContent('Load failed');
  });

  it('defaults to polite when no politeness is given', () => {
    announce('Default');
    expect(politeRegion()).toHaveTextContent('Default');
    expect(assertiveRegion()).toHaveTextContent('');
  });

  it('clears the region text 500ms after announcing', () => {
    announce('Loading…');
    expect(politeRegion()).toHaveTextContent('Loading…');
    vi.advanceTimersByTime(500);
    expect(politeRegion()).toHaveTextContent('');
  });

  it('announces queued messages one at a time, in order, across both regions', () => {
    announce('First', 'polite');
    announce('Second', 'assertive');
    announce('Third', 'polite');

    // Only the first message is visible immediately; the rest wait in queue.
    expect(politeRegion()).toHaveTextContent('First');
    expect(assertiveRegion()).toHaveTextContent('');

    vi.advanceTimersByTime(500); // First clears
    vi.advanceTimersByTime(100); // gap before pumping Second
    expect(assertiveRegion()).toHaveTextContent('Second');
    expect(politeRegion()).toHaveTextContent('');

    vi.advanceTimersByTime(500); // Second clears
    vi.advanceTimersByTime(100); // gap before pumping Third
    expect(politeRegion()).toHaveTextContent('Third');
  });

  it('announces the same message twice (repeat messages are not silently dropped)', () => {
    announce('12 cities');
    vi.advanceTimersByTime(600);
    expect(politeRegion()).toHaveTextContent('');

    announce('12 cities');
    expect(politeRegion()).toHaveTextContent('12 cities');
  });

  it('ignores empty or whitespace-only messages', () => {
    announce('');
    announce('   ');
    expect(politeRegion()).toBeNull();
    expect(assertiveRegion()).toBeNull();
  });
});
