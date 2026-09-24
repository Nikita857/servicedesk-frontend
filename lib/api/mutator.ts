import { AxiosHeaders, type AxiosRequestConfig, type RawAxiosHeaders } from 'axios';
import apiClient from './client';

type RequestConfig = AxiosRequestConfig;

/** Orval emits API-prefixed paths; the shared instance already supplies that prefix. */
export const customInstance = async <T>(config: RequestConfig): Promise<T> => {
  const basePath = apiClient.defaults.baseURL?.replace(/\/$/, '');
  const url = basePath && config.url?.startsWith(`${basePath}/`)
    ? config.url.slice(basePath.length)
    : config.url;
  const headers = AxiosHeaders.from(config.headers as RawAxiosHeaders | AxiosHeaders | undefined);
  const params = config.params
    ? { ...config.params, ...config.params.filter, ...config.params.pageable }
    : undefined;
  if (params && 'pageable' in params) delete params.pageable;
  if (params && 'filter' in params) delete params.filter;

  // Let Axios choose the multipart boundary for the current runtime.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    headers.set('Content-Type', false);
  }

  const response = await apiClient.request<T>({
    ...config, url, params, headers,
    paramsSerializer: config.paramsSerializer ?? { indexes: null },
  });
  return response.data;
};
