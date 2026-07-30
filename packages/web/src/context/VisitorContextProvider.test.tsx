import { StrictMode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createVisitorContextStore, type StorageLike } from '../lib/visitor-context-store';
import { VisitorContextProvider } from './VisitorContextProvider';
import { useVisitorContext } from './visitor-context';

const TOKYO = { slug: 'tokyo-jp', name: 'Tokyo', regionName: 'Japan' };
const LONDON = { slug: 'london-gb', name: 'London', regionName: 'United Kingdom' };

function createFakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

/** Probe component exercising every action so tests can drive the provider through real DOM
 * events rather than reaching into React internals. */
function Probe() {
  const { homeCity, isDurable, setHomeCity, clearHomeCity, reconcileHomeCity, forgetAll } =
    useVisitorContext();
  return (
    <div>
      <span data-testid="home-city">{homeCity ? `${homeCity.name}, ${homeCity.regionName}` : 'none'}</span>
      <span data-testid="durable">{String(isDurable)}</span>
      <button onClick={() => setHomeCity(TOKYO)}>pin tokyo</button>
      <button onClick={() => setHomeCity(LONDON)}>pin london</button>
      <button onClick={() => clearHomeCity()}>clear</button>
      <button onClick={() => reconcileHomeCity({ ...TOKYO, name: 'Tokyo Metropolis' })}>
        reconcile tokyo
      </button>
      <button onClick={() => forgetAll()}>forget</button>
    </div>
  );
}

describe('useVisitorContext', () => {
  it('throws when used outside VisitorContextProvider', () => {
    // Swallow the expected console.error from React's error boundary logging.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/useVisitorContext must be used inside/);
    spy.mockRestore();
  });
});

describe('VisitorContextProvider', () => {
  it('hydrates from the injected store on first render (not after an effect)', () => {
    const storage = createFakeStorage();
    storage.data.set(
      'probably-weather:visitor-context',
      JSON.stringify({ version: 1, homeCity: TOKYO }),
    );
    const store = createVisitorContextStore(storage);
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    // No `findBy`/`waitFor` — the value must already be correct on the very first render.
    expect(screen.getByTestId('home-city')).toHaveTextContent('Tokyo, Japan');
  });

  it('defaults to no home city when storage is empty', () => {
    const store = createVisitorContextStore(createFakeStorage());
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    expect(screen.getByTestId('home-city')).toHaveTextContent('none');
  });

  it('setHomeCity persists to the store and updates context value', async () => {
    const store = createVisitorContextStore(createFakeStorage());
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'pin tokyo' }));

    expect(screen.getByTestId('home-city')).toHaveTextContent('Tokyo, Japan');
    expect(store.read().homeCity).toEqual(TOKYO);
  });

  it('clearHomeCity clears the store and context value', async () => {
    const store = createVisitorContextStore(createFakeStorage());
    store.write({ version: 1, homeCity: TOKYO });
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'clear' }));

    expect(screen.getByTestId('home-city')).toHaveTextContent('none');
    expect(store.read().homeCity).toBeNull();
  });

  it('reconcileHomeCity updates a stale cached name for the same slug', async () => {
    const store = createVisitorContextStore(createFakeStorage());
    store.write({ version: 1, homeCity: TOKYO });
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'reconcile tokyo' }));

    expect(screen.getByTestId('home-city')).toHaveTextContent('Tokyo Metropolis, Japan');
  });

  it('reconcileHomeCity is a no-op when nothing is pinned', async () => {
    const store = createVisitorContextStore(createFakeStorage());
    const writeSpy = vi.spyOn(store, 'write');
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'reconcile tokyo' }));

    expect(screen.getByTestId('home-city')).toHaveTextContent('none');
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('forgetAll returns true and clears when something was pinned', async () => {
    const store = createVisitorContextStore(createFakeStorage());
    store.write({ version: 1, homeCity: TOKYO });
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'forget' }));
    expect(screen.getByTestId('home-city')).toHaveTextContent('none');
    expect(store.read().homeCity).toBeNull();
  });

  it('reports isDurable:false after a write that fails to reach storage', async () => {
    const throwingStorage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    const store = createVisitorContextStore(throwingStorage);
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'pin tokyo' }));

    expect(screen.getByTestId('durable')).toHaveTextContent('false');
    // Still works in memory for the rest of the session.
    expect(screen.getByTestId('home-city')).toHaveTextContent('Tokyo, Japan');
  });

  it('under StrictMode, mounting performs zero storage writes and each action performs exactly one', async () => {
    const store = createVisitorContextStore(createFakeStorage());
    const writeSpy = vi.spyOn(store, 'write');
    render(
      <StrictMode>
        <VisitorContextProvider store={store}>
          <Probe />
        </VisitorContextProvider>
      </StrictMode>,
    );
    expect(writeSpy).not.toHaveBeenCalled();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'pin tokyo' }));
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  it('applies a cross-tab storage event for the same key', () => {
    const store = createVisitorContextStore(createFakeStorage());
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    expect(screen.getByTestId('home-city')).toHaveTextContent('none');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: store.key,
          newValue: JSON.stringify({ version: 1, homeCity: LONDON }),
        }),
      );
    });

    expect(screen.getByTestId('home-city')).toHaveTextContent('London, United Kingdom');
  });

  it('ignores a storage event for an unrelated key', () => {
    const store = createVisitorContextStore(createFakeStorage());
    store.write({ version: 1, homeCity: TOKYO });
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    expect(screen.getByTestId('home-city')).toHaveTextContent('Tokyo, Japan');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'some-other-app:key',
          newValue: JSON.stringify({ version: 1, homeCity: LONDON }),
        }),
      );
    });

    expect(screen.getByTestId('home-city')).toHaveTextContent('Tokyo, Japan');
  });

  it('treats a null-key storage event (localStorage.clear()) as clearing this key too', () => {
    const store = createVisitorContextStore(createFakeStorage());
    store.write({ version: 1, homeCity: TOKYO });
    render(
      <VisitorContextProvider store={store}>
        <Probe />
      </VisitorContextProvider>,
    );
    expect(screen.getByTestId('home-city')).toHaveTextContent('Tokyo, Japan');

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null }));
    });

    expect(screen.getByTestId('home-city')).toHaveTextContent('none');
  });
});
