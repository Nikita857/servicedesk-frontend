import {
  clientDestinations,
  serverDestinations,
  type ClientChannel,
  type ClientMessages,
  type ServerChannel,
  type ServerMessages,
} from './generated/catalog';

type FillAddress<T extends string> = T extends `${infer Start}{${string}}${infer End}`
  ? `${Start}${number}${FillAddress<End>}`
  : T;

export type Destination<K extends ClientChannel | ServerChannel> =
  K extends ServerChannel ? FillAddress<(typeof serverDestinations)[K]> :
  K extends ClientChannel ? FillAddress<(typeof clientDestinations)[K]> : never;

export interface WebSocketTransport {
  subscribe(destination: string, callback: (message: { body: string }) => void): () => void;
  publish(frame: { destination: string; body: string }): void;
}

export class WebSocketDecodeError extends Error {
  constructor(readonly destination: string, cause: unknown) {
    super(`Failed to decode WebSocket message from ${destination}`, { cause });
    this.name = 'WebSocketDecodeError';
  }
}

function matchesCatalog(destination: string, catalog: Record<string, string>): boolean {
  return Object.values(catalog).some(template => {
    const parts = template.split(/\{[^}]+\}/g);
    const variables = template.match(/\{[^}]+\}/g)?.length ?? 0;
    if (!variables) return destination === template;
    const expression = new RegExp(`^${parts.map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('([0-9]+)')}$`);
    return expression.test(destination);
  });
}

export function createWebSocketContract(transport: WebSocketTransport) {
  return {
    subscribeTyped<K extends ServerChannel>(destination: Destination<K>, callback: (payload: ServerMessages[K]) => void): () => void {
      if (!matchesCatalog(destination, serverDestinations)) throw new Error(`Unknown server destination: ${destination}`);
      return transport.subscribe(destination, message => {
        let payload: ServerMessages[K];
        try {
          payload = JSON.parse(message.body) as ServerMessages[K];
        } catch (cause) {
          throw new WebSocketDecodeError(destination, cause);
        }
        callback(payload);
      });
    },
    publishTyped<K extends ClientChannel>(destination: Destination<K>, payload: ClientMessages[K]): void {
      if (!matchesCatalog(destination, clientDestinations)) throw new Error(`Unknown client destination: ${destination}`);
      transport.publish({ destination, body: JSON.stringify(payload === null ? {} : payload) });
    },
  };
}
