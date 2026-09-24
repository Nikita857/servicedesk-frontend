// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';

interface FakeSubscription {
  destination: string;
  active: boolean;
  callback: (message: { body: string }) => void;
}

interface FakeClient {
  connected: boolean;
  onConnect?: () => void;
  onWebSocketClose?: (event: CloseEvent) => void;
  subscriptions: FakeSubscription[];
}

const clients = vi.hoisted(() => [] as FakeClient[]);
const auth = vi.hoisted(() => ({ user: { id: 7 }, isAuthenticated: true }));

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    connected = false;
    onConnect?: () => void;
    onWebSocketClose?: (event: CloseEvent) => void;
    subscriptions: FakeSubscription[] = [];

    constructor() { clients.push(this); }
    activate() {}
    deactivate() {}
    subscribe(destination: string, callback: FakeSubscription['callback']) {
      const subscription = { destination, callback, active: true };
      this.subscriptions.push(subscription);
      return { unsubscribe: () => { subscription.active = false; } };
    }
    publish() {}
  },
}));
vi.mock('@/stores', () => ({ useAuthStore: () => auth }));
vi.mock('@/lib/api/client', () => ({ refreshAccessToken: vi.fn() }));

import { WebSocketProvider, useWebSocket } from './WebSocketProvider';

function TicketSubscriber() {
  const { isConnected, subscribeToTickets } = useWebSocket();
  const [received, setReceived] = useState(0);

  useEffect(() => {
    if (!isConnected) return;
    return subscribeToTickets(() => setReceived(count => count + 1));
  }, [isConnected, subscribeToTickets]);

  return <span data-testid="socket-state">{`${isConnected}:${received}`}</span>;
}

afterEach(() => { cleanup(); clients.length = 0; });

it('disconnects on network close and restores topic subscriptions after reconnect', () => {
  render(<WebSocketProvider><TicketSubscriber /></WebSocketProvider>);
  const client = clients[0];

  act(() => { client.connected = true; client.onConnect?.(); });
  expect(screen.getByTestId('socket-state').textContent).toBe('true:0');
  expect(client.subscriptions.map(subscription => subscription.destination)).toEqual(['/topic/tickets']);

  act(() => { client.connected = false; client.onWebSocketClose?.(new CloseEvent('close')); });
  expect(screen.getByTestId('socket-state').textContent).toBe('false:0');
  expect(client.subscriptions[0].active).toBe(false);

  act(() => { client.connected = true; client.onConnect?.(); });
  expect(client.subscriptions.map(subscription => subscription.destination)).toEqual(['/topic/tickets', '/topic/tickets']);
  act(() => client.subscriptions[1].callback({ body: '{"id":42,"eventType":"UPDATED"}' }));
  expect(screen.getByTestId('socket-state').textContent).toBe('true:1');
});
