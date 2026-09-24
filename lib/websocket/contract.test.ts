import { describe, expect, it, vi } from 'vitest';
import { createWebSocketContract, WebSocketDecodeError } from './contract';

function fakeTransport() {
  const handlers = new Map<string, (message: { body: string }) => void>();
  const published: Array<{ destination: string; body: string }> = [];
  return {
    handlers,
    published,
    subscribe(destination: string, callback: (message: { body: string }) => void) {
      handlers.set(destination, callback);
      return () => handlers.delete(destination);
    },
    publish(frame: { destination: string; body: string }) {
      published.push(frame);
    },
  };
}

describe('typed WebSocket contract', () => {
  it('decodes a valid message for its subscriber', () => {
    const transport = fakeTransport();
    const callback = vi.fn();
    createWebSocketContract(transport).subscribeTyped('/topic/ticket/42/deleted', callback);

    transport.handlers.get('/topic/ticket/42/deleted')?.({ body: '{"deleted":true,"id":42}' });

    expect(callback).toHaveBeenCalledWith({ deleted: true, id: 42 });
  });

  it('reports malformed JSON as a typed decode error without disrupting another subscription', () => {
    const transport = fakeTransport();
    const onBad = vi.fn();
    const onGood = vi.fn();
    const contract = createWebSocketContract(transport);
    contract.subscribeTyped('/topic/ticket/42/deleted', onBad);
    contract.subscribeTyped('/topic/ticket/43/deleted', onGood);

    expect(() => transport.handlers.get('/topic/ticket/42/deleted')?.({ body: '{broken' }))
      .toThrow(WebSocketDecodeError);
    expect(onBad).not.toHaveBeenCalled();
    expect(() => transport.handlers.get('/topic/ticket/43/deleted')?.({ body: '{"deleted":true,"id":43}' }))
      .not.toThrow();
    expect(onGood).toHaveBeenCalledWith({ deleted: true, id: 43 });
  });

  it('rejects destinations outside the generated catalog', () => {
    const contract = createWebSocketContract(fakeTransport());
    expect(() => contract.subscribeTyped('/topic/unknown' as never, vi.fn())).toThrow(/Unknown server destination/);
    expect(() => contract.publishTyped('/app/unknown' as never, {} as never)).toThrow(/Unknown client destination/);
  });

  it('publishes JSON to a concrete destination with the ticket ID', () => {
    const transport = fakeTransport();
    createWebSocketContract(transport).publishTyped('/app/ticket/42/send', { content: 'Hello', internal: false });

    expect(transport.published).toEqual([{ destination: '/app/ticket/42/send', body: '{"content":"Hello","internal":false}' }]);
  });
});
