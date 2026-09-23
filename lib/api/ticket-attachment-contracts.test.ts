import { beforeEach, expect, it, vi } from 'vitest';

const wire = vi.hoisted(() => ({
  requests: [] as Array<{ url?: string; method?: string; params?: unknown; data?: unknown; responseType?: string; headers?: unknown }>,
  response: undefined as unknown,
}));
vi.mock('./mutator', () => ({ customInstance: async (request: typeof wire.requests[number]) => {
  wire.requests.push(request);
  return wire.response;
} }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: { getState: () => ({}) } }));
vi.mock('@/lib/utils', () => ({ toast: { warning: vi.fn() } }));

import { ticketApi } from './tickets';
import { assignmentApi } from './assignments';
import { messageApi } from './messages';
import { attachmentApi } from './attachments';
import { getServiceDeskAPI } from './generated/client';
import type { AssignmentCreateRequest } from './generated/models';

beforeEach(() => { wire.requests = []; wire.response = { success: true, data: {} }; });

it('maps ticket pagination and status filters from the generated page', async () => {
  wire.response = { success: true, data: { content: [{ id: 8, status: 'PENDING_CLOSURE', assignedTo: null }], number: 2, size: 5, totalElements: 11, totalPages: 3 } };
  await expect(ticketApi.listFiltered(2, 5, 'PENDING_CLOSURE', 4, 8, undefined, undefined, ['NEW', 'OPEN'])).resolves.toEqual({
    content: [{ id: 8, status: 'PENDING_CLOSURE', assignedTo: null }],
    page: { number: 2, size: 5, totalElements: 11, totalPages: 3 },
  });
  expect(wire.requests[0]).toMatchObject({ url: '/api/v1/tickets', method: 'GET', params: { pageable: { page: 2, size: 5 }, status: 'PENDING_CLOSURE', lineId: 4, ticketId: 8, statuses: ['NEW', 'OPEN'] } });
});

it('preserves null assignee on a ticket', async () => {
  wire.response = { success: true, data: { id: 8, assignedTo: null, status: 'NEW' } };
  await expect(ticketApi.get(8)).resolves.toMatchObject({ assignedTo: null, status: 'NEW' });
});

it('rejects a failed ApiResponse instead of returning missing data', async () => {
  wire.response = { success: false, message: 'Ticket unavailable' };
  await expect(ticketApi.get(8)).rejects.toThrow('Ticket unavailable');
});

it('retains descending message sort and the public page shape', async () => {
  wire.response = { success: true, data: { content: [{ id: 3 }], number: 1, size: 50, totalElements: 51, totalPages: 2, first: false, last: true } };
  await expect(messageApi.list(8, 1, 50)).resolves.toMatchObject({ content: [{ id: 3 }], number: 1, totalElements: 51, last: true });
  expect(wire.requests[0]).toMatchObject({ url: '/api/v1/tickets/8/messages', params: { pageable: { page: 1, size: 50, sort: ['createdAt,desc'] } } });
});

it('passes a nullable assignment response through the current-assignment helper', async () => {
  wire.response = { success: true, data: null };
  await expect(assignmentApi.getCurrentForTicket(8)).resolves.toBeNull();
});

it('rejects an assignment without a source line before making a request', async () => {
  const request = { ticketId: 8, toLineId: 4, fromLineId: null, note: 'forward' } as unknown as AssignmentCreateRequest;
  await expect(assignmentApi.create(request)).rejects.toThrow('Source support line is required');
  expect(wire.requests).toEqual([]);
});

it('sends a valid generated assignment request', async () => {
  const request: AssignmentCreateRequest = { ticketId: 8, fromLineId: 2, toLineId: 4, note: 'forward', mode: 'FIRST_AVAILABLE' };
  wire.response = { success: true, data: { id: 20, ticketId: 8 } };
  await expect(assignmentApi.create(request)).resolves.toMatchObject({ id: 20 });
  expect(wire.requests[0]).toMatchObject({ url: '/api/v1/assignments', method: 'POST', data: request });
});

it('sends generated multipart completion data and returns the attachment', async () => {
  const request = { fileKey: 'key', bucket: 'bucket', uploadId: 'upload', parts: [{ partNumber: 1, etag: 'etag' }], filename: 'a.bin', contentType: 'application/octet-stream', fileSize: 12, targetType: 'TICKET' as const, targetId: 8 };
  wire.response = { success: true, data: { id: 12, filename: 'a.bin' } };
  await expect(attachmentApi.completeMultipart(request)).resolves.toMatchObject({ id: 12 });
  expect(wire.requests[0]).toMatchObject({ url: '/api/v1/attachments/multipart/complete', method: 'POST', data: request });
});

it('keeps the multipart initiate, part URL, and abort request shapes', async () => {
  wire.response = { success: true, data: { uploadId: 'upload', fileKey: 'key', bucket: 'bucket' } };
  await expect(attachmentApi.initiateMultipart({ filename: 'a.bin', contentType: 'application/octet-stream', targetType: 'TICKET', targetId: 8 })).resolves.toMatchObject({ uploadId: 'upload' });
  expect(wire.requests[0]).toMatchObject({ url: '/api/v1/attachments/multipart/initiate', data: { targetType: 'TICKET', targetId: 8 } });
  wire.response = { success: true, data: { partUrl: 'https://storage.example/part' } };
  await expect(attachmentApi.getPartUrl({ fileKey: 'key', bucket: 'bucket', uploadId: 'upload', partNumber: 1 })).resolves.toEqual({ partUrl: 'https://storage.example/part' });
  expect(wire.requests[1]).toMatchObject({ url: '/api/v1/attachments/multipart/part-url', data: { partNumber: 1 } });
  wire.response = { success: true };
  await attachmentApi.abortMultipart({ fileKey: 'key', bucket: 'bucket', uploadId: 'upload' });
  expect(wire.requests[2]).toMatchObject({ url: '/api/v1/attachments/multipart/abort', method: 'POST' });
});

it('preserves named presigned download and view URL helpers', async () => {
  wire.response = { success: true, data: { downloadUrl: 'https://storage.example/file' } };
  await expect(attachmentApi.getUrl(12)).resolves.toEqual({ downloadUrl: 'https://storage.example/file' });
  expect(wire.requests[0]).toMatchObject({ url: '/api/v1/attachments/12/url', method: 'GET' });
  wire.response = { success: true, data: { viewUrl: 'https://storage.example/inline' } };
  await expect(attachmentApi.getViewUrl(12)).resolves.toEqual({ viewUrl: 'https://storage.example/inline' });
  expect(wire.requests[1]).toMatchObject({ url: '/api/v1/attachments/12/view-url', method: 'GET' });
});

it('uses the generated binary download operation and returns its blob', async () => {
  const blob = new Blob(['file']);
  wire.response = blob;
  await expect(attachmentApi.download(12)).resolves.toBe(blob);
  expect(wire.requests[0]).toMatchObject({ url: '/api/v1/attachments/12/download', responseType: 'blob' });
});

it.each([
  ['ticket', (file: Blob) => getServiceDeskAPI().uploadToTicket(8, { file })],
  ['message', (file: Blob) => getServiceDeskAPI().uploadToMessage(8, { file })],
])('generated %s upload sends a FormData file', async (_target, upload) => {
  wire.response = { success: true, data: { id: 12 } };
  const file = new Blob(['content']);
  await upload(file);
  expect(wire.requests[0].data).toBeInstanceOf(FormData);
  expect(await ((wire.requests[0].data as FormData).get('file') as Blob).text()).toBe('content');
});
