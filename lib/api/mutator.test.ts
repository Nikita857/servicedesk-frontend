import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import apiClient from './client';
import { customInstance } from './mutator';
import { getServiceDeskAPI } from './generated/client';

vi.mock('@/stores/authStore', () => ({ useAuthStore: { getState: () => ({}) } }));
vi.mock('@/lib/utils', () => ({ toast: { warning: vi.fn() } }));

const originalAdapter = apiClient.defaults.adapter;
let seen: InternalAxiosRequestConfig[];
let requestInterceptor: number;
let responseInterceptor: number;
let errorPath: ReturnType<typeof vi.fn>;

beforeEach(() => {
  seen = [];
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=csrf-test' });
  requestInterceptor = apiClient.interceptors.request.use(config => {
    config.headers.set('X-Test-Interceptor', 'visited');
    return config;
  });
  errorPath = vi.fn();
  responseInterceptor = apiClient.interceptors.response.use(response => response, error => {
    errorPath(error);
    return Promise.reject(error);
  });
  apiClient.defaults.adapter = (async config => {
    seen.push(config);
    return { config, data: { ok: true }, headers: {}, status: 200, statusText: 'OK' };
  }) satisfies AxiosAdapter;
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  apiClient.interceptors.request.eject(requestInterceptor);
  apiClient.interceptors.response.eject(responseInterceptor);
  vi.unstubAllGlobals();
});

it('passes generated request fields through the shared client and its auth and CSRF configuration', async () => {
  const params = { page: 2 };
  const body = { title: 'sample' };
  await expect(customInstance<{ ok: boolean }>({
    url: '/api/v1/tickets', method: 'POST', params, data: body,
  })).resolves.toEqual({ ok: true });

  expect(seen).toHaveLength(1);
  expect(seen[0]).toMatchObject({
    url: '/tickets', method: 'post', params, withCredentials: true,
    baseURL: '/api/v1',
  });
  expect(seen[0].data).toBe(JSON.stringify(body));
  expect(seen[0].headers.get('X-XSRF-TOKEN')).toBe('csrf-test');
  expect(seen[0].headers.get('X-Test-Interceptor')).toBe('visited');
  expect(apiClient.getUri(seen[0])).toBe('/api/v1/tickets?page=2');
});

it('routes an actual generated operation through the existing client', async () => {
  await getServiceDeskAPI().getAllRules();
  expect(seen).toHaveLength(1);
  expect(seen[0].headers.get('X-Test-Interceptor')).toBe('visited');
  expect(apiClient.getUri(seen[0])).toBe('/api/v1/admin/forwarding-rules');
});

it('serializes a generated Pageable as Spring page and size query parameters', async () => {
  await customInstance({ url: '/api/v1/admin/users', method: 'GET', params: { pageable: { page: 2, size: 20 } } });
  expect(apiClient.getUri(seen[0])).toBe('/api/v1/admin/users?page=2&size=20');
});

it('flattens Spring model-attribute filters beside pagination', async () => {
  await getServiceDeskAPI().getTasks({
    filter: { status: 'SCHEDULED', from: '2026-09-01T00:00:00Z' },
    pageable: { page: 1, size: 10 },
  });
  expect(apiClient.getUri(seen[0])).toBe('/api/v1/scheduled-tasks?status=SCHEDULED&from=2026-09-01T00:00:00Z&page=1&size=10');
});

it('serializes generated array query parameters as repeated Spring keys', async () => {
  await getServiceDeskAPI().updateRoles(7, { roles: ['ADMIN', 'USER'] });
  expect(apiClient.getUri(seen[0])).toBe('/api/v1/admin/users/7/roles?roles=ADMIN&roles=USER');
});

it('returns the response body for a 204 without inventing an envelope', async () => {
  apiClient.defaults.adapter = async config => ({
    config, data: '', headers: {}, status: 204, statusText: 'No Content',
  });
  await expect(customInstance<string>({ url: '/api/v1/tickets/1', method: 'DELETE' })).resolves.toBe('');
});

it('propagates the same Axios error through the shared response path', async () => {
  const error = new AxiosError('server failed', 'ERR_BAD_RESPONSE');
  apiClient.defaults.adapter = async config => {
    error.config = config;
    error.response = { config, data: { errorCode: 'OTHER' }, headers: {}, status: 500, statusText: 'Error' };
    throw error;
  };
  await expect(customInstance({ url: '/api/v1/tickets', method: 'GET' })).rejects.toBe(error);
  expect(errorPath).toHaveBeenCalledExactlyOnceWith(error);
});

it('keeps multipart FormData intact without setting a boundary and uses the usual interceptors and error path', async () => {
  const form = new FormData();
  form.append('file', new Blob(['data']), 'example.txt');
  const error = new AxiosError('upload failed', 'ERR_BAD_RESPONSE');
  apiClient.defaults.adapter = async config => {
    seen.push(config);
    error.config = config;
    error.response = { config, data: { errorCode: 'OTHER' }, headers: {}, status: 500, statusText: 'Error' };
    throw error;
  };
  await expect(customInstance({
    url: '/api/v1/files', method: 'POST', data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
  })).rejects.toBe(error);

  expect(seen[0].data).toBe(form);
  expect(seen[0].headers.toJSON()).not.toHaveProperty('Content-Type');
  expect(seen[0].headers.get('X-XSRF-TOKEN')).toBe('csrf-test');
  expect(seen[0].headers.get('X-Test-Interceptor')).toBe('visited');
  expect(errorPath).toHaveBeenCalledExactlyOnceWith(error);
});

it('passes binary responseType through and returns the blob', async () => {
  const blob = new Blob(['bytes']);
  apiClient.defaults.adapter = async config => {
    seen.push(config);
    return { config, data: blob, headers: {}, status: 200, statusText: 'OK' };
  };
  await expect(customInstance<Blob>({
    url: '/api/v1/files/1', method: 'GET', responseType: 'blob',
  })).resolves.toBe(blob);
  expect(seen[0].responseType).toBe('blob');
});

it('routes generated ticket upload through the shared multipart and CSRF path', async () => {
  const file = new Blob(['ticket file']);
  await getServiceDeskAPI().uploadToTicket(8, { file });
  expect(seen).toHaveLength(1);
  expect(apiClient.getUri(seen[0])).toBe('/api/v1/tickets/8/attachments');
  expect(seen[0].data).toBeInstanceOf(FormData);
  expect(await ((seen[0].data as FormData).get('file') as Blob).text()).toBe('ticket file');
  expect(seen[0].headers.toJSON()).not.toHaveProperty('Content-Type');
  expect(seen[0].headers.get('X-XSRF-TOKEN')).toBe('csrf-test');
  expect(seen[0].headers.get('X-Test-Interceptor')).toBe('visited');
});

it('routes generated binary download through the shared client', async () => {
  const blob = new Blob(['download']);
  apiClient.defaults.adapter = async config => {
    seen.push(config);
    return { config, data: blob, headers: {}, status: 200, statusText: 'OK' };
  };
  await expect(getServiceDeskAPI().downloadById(8)).resolves.toBe(blob);
  expect(apiClient.getUri(seen[0])).toBe('/api/v1/attachments/8/download');
  expect(seen[0].responseType).toBe('blob');
  expect(seen[0].headers.get('X-Test-Interceptor')).toBe('visited');
});
