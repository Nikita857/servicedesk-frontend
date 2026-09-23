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
