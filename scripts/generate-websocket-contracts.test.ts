import { expect, it } from 'vitest';
import { generateWebSocketContracts } from './generate-websocket-contracts';

const fixture = {
  asyncapi: '3.0.0',
  components: {
    schemas: {
      Ping: { type: 'object', required: ['id'], properties: { id: { type: 'integer' }, label: { type: ['string', 'null'] } } },
    },
    messages: { Ping: { payload: { $ref: '#/components/schemas/Ping' } } },
  },
  channels: {
    ping: { address: '/topic/{id}', 'x-stomp-destination': '/topic/{id}', 'x-message-direction': 'server', messages: { Ping: { $ref: '#/components/messages/Ping' } } },
  },
};

it('generates stable payload and destination output when source key order changes', async () => {
  const first = await generateWebSocketContracts(fixture);
  const reordered = structuredClone(fixture);
  reordered.components.schemas.Ping.properties = {
    label: { type: ['string', 'null'] },
    id: { type: 'integer' },
  };
  expect(await generateWebSocketContracts(reordered)).toEqual(first);
  expect(first['models.ts']).toContain('export interface Ping');
  expect(first['catalog.ts']).toContain('ping: "/topic/{id}"');
  expect(first['catalog.ts']).toContain('ping: Models.Ping');
  expect(first['models.ts']).not.toMatch(/generated at|timestamp/i);
});
