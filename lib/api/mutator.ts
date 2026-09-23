import type { AxiosRequestConfig } from 'axios';

// Task 4 connects generated operations to the shared Axios instance.
export const customInstance = <T>(_config: AxiosRequestConfig): Promise<T> => {
  void _config;
  throw new Error('Generated API mutator is not connected yet');
};
