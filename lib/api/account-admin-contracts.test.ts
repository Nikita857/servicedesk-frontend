import { beforeEach, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ requests: [] as Array<{ url?: string; method?: string; params?: unknown; data?: unknown }>, result: undefined as unknown }));
vi.mock('./mutator', () => ({ customInstance: async (config: { url?: string; method?: string; params?: unknown; data?: unknown }) => {
  calls.requests.push(config);
  return calls.result;
} }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: { getState: () => ({}) } }));
vi.mock('@/lib/utils', () => ({ toast: { warning: vi.fn() } }));
vi.mock('../utils', () => ({ handleApiError: vi.fn() }));

import { authApi } from './auth';
import { profileApi } from './profile';
import { userApi } from './users';
import { rbacApi } from './rbac';
import { adminApi } from './admin';
import { departmentApi } from './departments';
import { categoriesApi } from './categories';
import { specialistTypeApi } from './specialistTypes';
import { supportLineApi } from './supportLines';
import { forwardingRulesApi } from './forwardingRules';
import { notificationSettingsApi } from './notificationSettings';
import { maintenanceApi } from './maintenance';

beforeEach(() => { calls.requests = []; calls.result = { success: true, data: [] }; });

it('auth login sends credentials through the generated contract and unwraps its envelope', async () => {
  const user = { id: 3, username: 'user' };
  const data = { expiresIn: 3600, userAuthResponse: user };
  calls.result = { success: true, data };
  await expect(authApi.login({ username: 'user', password: 'pass' })).resolves.toEqual(data);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/auth/login', method: 'POST', data: { username: 'user', password: 'pass' } });
});

it('auth login rejects an empty generated envelope before creating a session', async () => {
  calls.result = { success: true };
  await expect(authApi.login({ username: 'user', password: 'pass' })).rejects.toThrow('Authentication response is missing user data');
});

it('profile update preserves nullable response values', async () => {
  const data = { id: 3, fio: null, email: null };
  calls.result = { data };
  await expect(profileApi.updateProfile({ fio: 'Name' })).resolves.toEqual(data);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/profile', method: 'PATCH', data: { fio: 'Name' } });
});

it('users search extracts content from the generated page envelope', async () => {
  const content = [{ id: 2, username: 'abc', fio: 'Name' }];
  calls.result = { data: { content, page: { number: 0, size: 1, totalElements: 1, totalPages: 1 } } };
  await expect(userApi.search('abc')).resolves.toEqual(content);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/users/search', params: { q: 'abc' } });
});

it('rbac roles preserve empty lists', async () => {
  await expect(rbacApi.getAllRoles()).resolves.toEqual([]);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/rbac/roles', method: 'GET' });
});

it('admin maps specialist type form field into the generated create request', async () => {
  calls.result = { data: { id: 5, username: 'new' } };
  await adminApi.createUser({ username: 'new', password: 'pass', fio: 'New', email: null, roles: [], active: true, departmentId: null, positionId: null, specialistType: 'SYSADMIN' });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/admin/users', method: 'POST', data: { specialistTypeCode: 'SYSADMIN' } });
});

it('admin users flatten pageable params and keep the public page result shape', async () => {
  calls.result = { data: { content: [], number: 2, size: 20, totalElements: 0, totalPages: 0 } };
  await expect(adminApi.getUsers(2, 20, 'ann')).resolves.toEqual({
    content: [], page: { number: 2, size: 20, totalElements: 0, totalPages: 0 },
  });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/admin/users', params: { page: 2, size: 20, search: 'ann' } });
});

it('admin sends empty query values to clear department and position', async () => {
  calls.result = { data: { id: 5, username: 'new' } };
  await adminApi.updateDepartmentAndPosition(5, null, null);
  expect(calls.requests[0]).toMatchObject({
    url: '/api/v1/admin/users/5/department-position', method: 'PATCH',
    params: { departmentId: '', positionId: '' },
  });
});

it('departments list unwraps an empty generated response', async () => {
  await expect(departmentApi.getDepartments()).resolves.toEqual([]);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/departments', method: 'GET' });
});

it('categories use the actual user-selectable endpoint', async () => {
  await expect(categoriesApi.getUserSelectable()).resolves.toEqual([]);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/categories/user-selectable', method: 'GET' });
});

it('specialist types use generated enum-safe request body', async () => {
  calls.result = { data: { id: 7, code: 'SYSADMIN' } };
  await specialistTypeApi.create({ code: 'SYSADMIN', name: 'Admin' });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/specialist-types', method: 'POST', data: { code: 'SYSADMIN', name: 'Admin' } });
});

it('support lines preserve an empty specialist list', async () => {
  await expect(supportLineApi.getSpecialists(4)).resolves.toEqual([]);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/support-lines/4/specialists', method: 'GET' });
});

it('forwarding rules send the generated envelope', async () => {
  await expect(forwardingRulesApi.update([{ sourceType: 'USER', targetType: 'SYSADMIN', enabled: true }])).resolves.toEqual([]);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/admin/forwarding-rules', method: 'PUT', data: { rules: [{ sourceType: 'USER', targetType: 'SYSADMIN', enabled: true }] } });
});

it('notification settings preserve a notification enum in the request', async () => {
  await notificationSettingsApi.update({ settings: [{ type: 'MESSAGE', inAppEnabled: true, bitrixEnabled: false, vkEnabled: false, maxEnabled: false }] });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/notification/settings', method: 'PUT', data: { settings: [{ type: 'MESSAGE' }] } });
});

it('maintenance preserves null message and expiration', async () => {
  const data = { active: false, message: null, endsAt: null, serverTime: '2026-09-23T00:00:00Z' };
  calls.result = { data };
  await expect(maintenanceApi.getStatus()).resolves.toEqual(data);
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/maintenance', method: 'GET' });
});
