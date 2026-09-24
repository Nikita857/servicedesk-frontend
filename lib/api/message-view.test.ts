import { beforeEach, expect, it, vi } from 'vitest';

const wire = vi.hoisted(() => ({ result: undefined as unknown }));
vi.mock('./mutator', () => ({ customInstance: async () => wire.result }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: { getState: () => ({}) } }));
vi.mock('@/lib/utils', () => ({ toast: { warning: vi.fn() } }));

import { messageApi } from './messages';

const message = {
  id: 3, ticketId: 8, content: 'Hello', sender: { id: 2, username: 'alice' },
  senderType: 'USER', createdAt: '2026-09-23T10:00:00Z', updatedAt: '2026-09-23T10:01:00Z',
};

beforeEach(() => { wire.result = { success: true, data: {} }; });

it('maps listed REST messages to the public chat view with default flags and sender nulls', async () => {
  wire.result = { success: true, data: {
    content: [message], number: 0, size: 50, totalElements: 1, totalPages: 1, first: true, last: true,
  } };
  await expect(messageApi.list(8)).resolves.toEqual({
    content: [{
      id: 3, ticketId: 8, content: 'Hello',
      sender: { id: 2, username: 'alice', fio: null, avatarUrl: null, isSpecialist: false },
      senderType: 'USER', internal: false, readByUser: false, readBySpecialist: false,
      edited: false, attachments: [], createdAt: '2026-09-23T10:00:00Z', updatedAt: '2026-09-23T10:01:00Z',
    }],
    number: 0, size: 50, totalElements: 1, totalPages: 1, first: true, last: true,
  });
});

it('maps sent REST message attachments into the public chat attachment shape', async () => {
  wire.result = { success: true, data: {
    ...message,
    attachments: [{
      id: 10, filename: 'a.txt', url: '/a.txt', fileSize: 5, mimeType: 'text/plain',
      type: 'DOCUMENT', ticketId: 8, messageId: 3,
      uploadedBy: { id: 2, username: 'alice' }, createdAt: '2026-09-23T10:00:00Z',
    }],
  } };
  const sent = await messageApi.send(8, { content: 'Hello' });
  expect(sent.attachments).toEqual([{
    id: 10, filename: 'a.txt', url: '/a.txt', fileSize: 5, mimeType: 'text/plain', type: 'DOCUMENT',
  }]);
  expect(sent.sender).toEqual({ id: 2, username: 'alice', fio: null, avatarUrl: null, isSpecialist: false });
});

it('maps a system message without a sender to the chat placeholder', async () => {
  wire.result = { success: true, data: { ...message, sender: null, senderType: 'SYSTEM' } };
  await expect(messageApi.edit(3, { content: 'Updated' })).resolves.toMatchObject({
    sender: { id: 0, username: 'unknown', fio: null, avatarUrl: null, isSpecialist: false },
    senderType: 'SYSTEM',
  });
});
