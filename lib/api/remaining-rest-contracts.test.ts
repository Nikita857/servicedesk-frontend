import { beforeEach, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ requests: [] as Array<{ url?: string; method?: string; params?: Record<string, unknown>; data?: unknown; responseType?: string }>, result: undefined as unknown, results: [] as unknown[], onRequest: undefined as ((config: { url?: string; method?: string; params?: Record<string, unknown>; data?: unknown; responseType?: string }) => void) | undefined }));
vi.mock('./mutator', () => ({ customInstance: async (config: { url?: string; method?: string; params?: Record<string, unknown>; data?: unknown; responseType?: string }) => {
  calls.requests.push(config);
  calls.onRequest?.(config);
  return calls.results.length ? calls.results.shift() : calls.result;
} }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: { getState: () => ({}) } }));
vi.mock('@/lib/utils', () => ({ toast: { warning: vi.fn() } }));
vi.mock('../utils', () => ({ withRetry: (operation: () => Promise<unknown>) => operation(), handleApiError: vi.fn() }));

import { announcementsApi } from './announcements';
import { agentApi } from './agent';
import { streamAgentMessage } from './agentStream';
import { searchAdminApi } from './search';
import { statsApi } from './stats';
import { reportsApi } from './reports';
import { scheduledTasksApi } from './scheduled-tasks';
import { surveysApi } from './surveys';
import { notificationsApi } from './notifications';
import { wikiApi } from './wiki';
import { wikiImageApi } from './wikiImages';
import { wikiVideoApi } from './wikiVideos';
import axios from 'axios';
import apiClient from './client';

beforeEach(() => { calls.requests = []; calls.results = []; calls.result = { success: true, data: [] }; calls.onRequest = undefined; });

it('announcement pages keep nullable dates and public page metadata', async () => {
  const item = { id: 2, title: 'Notice', expiresAt: null, archivedAt: null, createdAt: '2026-09-23T09:30:00Z' };
  calls.result = { data: { content: [item], number: 2, size: 5, totalElements: 11, totalPages: 3 } };
  await expect(announcementsApi.list(2, 5)).resolves.toEqual({ content: [item], page: { number: 2, size: 5, totalElements: 11, totalPages: 3 } });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/announcements', params: { pageable: { page: 2, size: 5 } } });
});

it('agent messages use the generated REST call with sort and retain nullable conversation title', async () => {
  const conversation = { id: 3, title: null, createdAt: '2026-09-23T09:30:00Z', updatedAt: '2026-09-23T09:30:00Z' };
  calls.result = { data: conversation };
  await expect(agentApi.getConversation(3)).resolves.toEqual(conversation);
  calls.result = { data: { content: [], number: 0, size: 50, totalElements: 0, totalPages: 0 } };
  await expect(agentApi.listMessages(3)).resolves.toEqual({ content: [], page: { number: 0, size: 50, totalElements: 0, totalPages: 0 } });
  expect(calls.requests[1]).toMatchObject({ url: '/api/v1/agent/conversations/3/messages', params: { pageable: { page: 0, size: 50, sort: ['createdAt,asc'] } } });
});

it('search reindex returns an empty response without unwrapping', async () => {
  calls.result = undefined;
  await expect(searchAdminApi.reindexSurveys()).resolves.toBeUndefined();
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/admin/search/reindex/surveys', method: 'POST' });
});

it('stats flattens page and preserves an empty page', async () => {
  calls.result = { data: { content: [], number: 1, size: 20, totalElements: 0, totalPages: 0 } };
  await expect(statsApi.getStatsByAllLines({ page: 1, size: 20 })).resolves.toEqual({ content: [], page: { number: 1, size: 20, totalElements: 0, totalPages: 0 } });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/stats/tickets/by-line', params: { page: 1, size: 20 } });
});

it('report export requests a blob through the generated operation', async () => {
  const blob = new Blob(['xlsx']);
  calls.result = blob;
  await expect(reportsApi.downloadScheduledTaskReport(4, 2026, 9)).resolves.toBe(blob);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/scheduled-tasks/report/export', responseType: 'blob', params: { departmentId: 4, year: 2026, month: 9 } });
});

it('orphaned report exports reject locally without requesting nonexistent routes', async () => {
  await expect(reportsApi.getTimeBySpecialist('2026-09-01', '2026-09-30')).rejects.toThrow('no backend operation exists');
  await expect(reportsApi.getTimeByLine('2026-09-01', '2026-09-30')).rejects.toThrow('no backend operation exists');
  await expect(reportsApi.getSpecialistWorkload()).rejects.toThrow('no backend operation exists');
  expect(calls.requests).toEqual([]);
});

it('keeps only SSE on native fetch and reports the pre-stream error envelope', async () => {
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=csrf-test' });
  const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Denied' }), { status: 403 }));
  vi.stubGlobal('fetch', fetchSpy);
  const onError = vi.fn();
  try {
    await streamAgentMessage({
      conversationId: 4, content: 'Hello', signal: new AbortController().signal,
      onDelta: vi.fn(), onDone: vi.fn(), onError, onCancelled: vi.fn(),
    });
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/agent/conversations/4/messages'), expect.objectContaining({ method: 'POST', body: JSON.stringify({ content: 'Hello' }) }));
    expect(onError).toHaveBeenCalledWith({ code: 'HTTP_403', message: 'Denied', errorId: null });
    expect(calls.requests).toEqual([]);
  } finally {
    vi.unstubAllGlobals();
  }
});

it('uses the generated current-user operation for CSRF bootstrap before the SSE fetch', async () => {
  let cookie = '';
  vi.stubGlobal('document', { get cookie() { return cookie; } });
  calls.onRequest = (config) => {
    if (config.url === '/api/v1/auth/me') cookie = 'XSRF-TOKEN=bootstrapped-token';
  };
  calls.result = { data: { id: 3 } };
  const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Denied' }), { status: 403 }));
  vi.stubGlobal('fetch', fetchSpy);
  const onError = vi.fn();
  try {
    await streamAgentMessage({
      conversationId: 9, content: 'Hello', signal: new AbortController().signal,
      onDelta: vi.fn(), onDone: vi.fn(), onError, onCancelled: vi.fn(),
    });
    expect(calls.requests).toEqual([expect.objectContaining({ url: '/api/v1/auth/me', method: 'GET' })]);
    expect(apiClient.defaults.withCredentials).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/agent/conversations/9/messages'), expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'bootstrapped-token' }),
    }));
    expect(onError).toHaveBeenCalledWith({ code: 'HTTP_403', message: 'Denied', errorId: null });
  } finally {
    vi.unstubAllGlobals();
  }
});

it('all tickets uses backend deletion flag and support-line field without fabricating a date', async () => {
  const ticket = { id: 8, title: 'Incident', isDeleted: true, supportLine: 'Line 1', createdAt: '2026-09-23T09:30:00Z' };
  calls.result = { data: { content: [ticket], number: 0, size: 20, totalElements: 1, totalPages: 1 } };
  const result = await reportsApi.getAllTickets();
  expect(result.content[0]).toEqual(ticket);
  expect(result.content[0]).not.toHaveProperty('deletedAt');
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/reports/tickets/all', params: { pageable: { page: 0, size: 20 }, filter: {} } });
});

it('scheduled tasks preserve the raw paged list and null deadline', async () => {
  const page = { content: [], page: { number: 0, size: 20, totalElements: 0, totalPages: 0 } };
  calls.result = page;
  await expect(scheduledTasksApi.list({}, 0, 20)).resolves.toEqual(page);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/scheduled-tasks', params: { pageable: { page: 0, size: 20 }, filter: {} } });
  calls.result = { data: null };
  await expect(scheduledTasksApi.getByTicket(9)).resolves.toBeNull();
});

it('survey detail preserves nullable description and ISO date', async () => {
  const detail = { id: 5, title: 'Pulse', description: null, endDate: '2026-10-01T00:00:00Z', questions: { elements: [] }, alreadyAnswered: false };
  calls.result = { data: detail };
  await expect(surveysApi.getById(5)).resolves.toEqual(detail);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/surveys/5', method: 'GET' });
});

it('notifications preserve nullable fields and use the generated page', async () => {
  const notification = { id: 7, title: null, body: null, createdAt: '2026-09-23T09:30:00Z' };
  calls.result = { data: { content: [notification], number: 0, size: 5, totalElements: 1, totalPages: 1 } };
  await expect(notificationsApi.list()).resolves.toEqual({ content: [notification], page: { number: 0, size: 5, totalElements: 1, totalPages: 1 } });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/notifications', params: { pageable: { page: 0, size: 5 } } });
});

it('wiki category search wraps a raw result array for the public UI shape', async () => {
  calls.result = { data: [] };
  await expect(wikiApi.searchCategories('policy', 1, 5)).resolves.toEqual({ content: [], page: { number: 1, size: 5, totalElements: 0, totalPages: 1 } });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/wiki/search', params: { q: 'policy', pageable: { page: 1, size: 5 } } });
});

it('wiki root list flattens article children and keeps the backend category page metadata', async () => {
  const article = { id: 41, title: 'Setup', slug: 'setup', excerpt: null, categoryName: 'Guides', departments: [], tags: [], author: null, viewCount: 4, likeCount: null, likedByCurrentUser: null, updatedAt: '2026-09-23T09:30:00Z' };
  const category = { id: 'category-12', name: 'Guides', children: [article] };
  calls.result = { data: { content: [category], number: 2, size: 5, totalElements: 13, totalPages: 3 } };
  await expect(wikiApi.list(2, 5)).resolves.toEqual({
    content: [article],
    page: { number: 2, size: 5, totalElements: 13, totalPages: 3 },
  });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/wiki', params: { pageable: { page: 2, size: 5 } } });
});

it('wiki search keeps nullable article like fields in the UI view', async () => {
  const article = { id: 42, title: 'Safety', slug: 'safety', excerpt: null, categoryName: 'Guides', departments: [], tags: [], author: null, viewCount: 8, likeCount: null, likedByCurrentUser: null, updatedAt: '2026-09-24T09:30:00Z' };
  calls.result = { data: [{ id: 2, name: 'Guides', article: [article], children: [] }] };
  await expect(wikiApi.search('safety', 1, 10)).resolves.toEqual({
    content: [article],
    page: { number: 1, size: 10, totalElements: 1, totalPages: 1 },
  });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/wiki/search', params: { q: 'safety', pageable: { page: 1, size: 10 } } });
});

it('wiki article creation rejects a missing required category before sending REST', async () => {
  await expect(wikiApi.create({ title: 'Guide', content: 'Text' })).rejects.toThrow('Category is required');
  expect(calls.requests).toEqual([]);
});

it('wiki image upload uses generated URL and confirm calls around the direct signed upload', async () => {
  const put = vi.spyOn(axios, 'put').mockResolvedValue({ headers: {} });
  const file = new File(['img'], 'icon.png', { type: 'image/png' });
  const media = { url: '/icon.png', fileKey: 'key', filename: 'icon.png', size: 3, mimeType: 'image/png' };
  // The transport fake returns a response for each backend operation.
  const responses = [{ data: { uploadUrl: 'https://storage.example/icon', fileKey: 'key', filename: 'icon.png' } }, { data: media }];
  calls.results = responses;
  await expect(wikiImageApi.uploadImage(file)).resolves.toEqual(media);
  expect(calls.requests.map(request => request.url)).toEqual(['/api/v1/wiki/images/upload-url', '/api/v1/wiki/images/confirm']);
  expect(put).toHaveBeenCalledWith('https://storage.example/icon', file, expect.any(Object));
  put.mockRestore();
});

it('wiki video delete uses the generated REST operation', async () => {
  await wikiVideoApi.deleteVideo('video-key');
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/wiki/videos/video-key', method: 'DELETE' });
});
