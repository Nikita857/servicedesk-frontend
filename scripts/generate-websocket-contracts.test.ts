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

it('keeps typing command and broadcast payloads distinct', async () => {
  const generated = await generateWebSocketContracts({
    asyncapi: '3.0.0',
    components: {
      schemas: {
        TicketTypingCommand: { type: 'object', required: ['typing'], properties: { typing: { type: 'boolean' } } },
        TypingIndicator: { type: 'object', required: ['ticketId', 'typing'], properties: { ticketId: { type: 'integer' }, typing: { type: 'boolean' } } },
      },
      messages: {
        TicketTypingCommand: { payload: { $ref: '#/components/schemas/TicketTypingCommand' } },
        TypingIndicator: { payload: { $ref: '#/components/schemas/TypingIndicator' } },
      },
    },
    channels: {
      ticketTypingCommand: { address: '/app/ticket/{ticketId}/typing', 'x-stomp-destination': '/app/ticket/{ticketId}/typing', 'x-message-direction': 'client', messages: { TicketTypingCommand: { $ref: '#/components/messages/TicketTypingCommand' } } },
      ticketTyping: { address: '/topic/ticket/{ticketId}/typing', 'x-stomp-destination': '/topic/ticket/{ticketId}/typing', 'x-message-direction': 'server', messages: { TypingIndicator: { $ref: '#/components/messages/TypingIndicator' } } },
    },
  });

  expect(generated['catalog.ts']).toContain('ticketTypingCommand: Models.TicketTypingCommand');
  expect(generated['catalog.ts']).toContain('ticketTyping: Models.TypingIndicator');
  expect(generated['models.ts']).toMatch(/interface TicketTypingCommand \{\s+typing: boolean;\s+\}/);
  expect(generated['models.ts']).toMatch(/interface TypingIndicator \{\s+ticketId: number;\s+typing: boolean;\s+\}/);
});
