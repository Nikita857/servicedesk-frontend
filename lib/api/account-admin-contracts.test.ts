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

const wireUser = {
  id: 5,
  username: 'new',
  fio: 'New User',
  avatarUrl: null,
  socialNetwork: { bitrixUserId: 42, vkId: null, maxId: 9 },
  specialist: false,
  roles: ['USER'],
  permissions: [],
  active: true,
  departmentName: null,
  positionName: null,
  specialistType: null,
};

beforeEach(() => { calls.requests = []; calls.result = { success: true, data: [] }; });

it('auth login sends credentials through the generated contract and unwraps its envelope', async () => {
  const data = { expiresIn: 3600, userAuthResponse: wireUser };
  calls.result = { success: true, data };
  await expect(authApi.login({ username: 'user', password: 'pass' })).resolves.toMatchObject({
    expiresIn: 3600, userAuthResponse: { id: 5, username: 'new' },
  });
  expect(calls.requests[0]).toMatchObject({ url: '/api/v1/auth/login', method: 'POST', data: { username: 'user', password: 'pass' } });
});

it('auth login rejects an empty generated envelope before creating a session', async () => {
  calls.result = { success: true };
  await expect(authApi.login({ username: 'user', password: 'pass' })).rejects.toThrow('Authentication response is missing user data');
});

it('auth login returns the public socialNetworks field instead of the wire socialNetwork field', async () => {
  calls.result = { data: { expiresIn: 3600, userAuthResponse: wireUser } };
  const result = await authApi.login({ username: 'new', password: 'pass' });
  expect(result.userAuthResponse.socialNetworks).toEqual({ bitrixUserId: 42, vkId: null, maxId: 9 });
  expect(result.userAuthResponse).not.toHaveProperty('socialNetwork');
});

it('profile update preserves nullable response values', async () => {
  const data = {
    id: 3, username: 'alice', fio: null, email: null,
    socialNetwork: { bitrixUserId: null, vkId: null, maxId: null },
    avatarUrl: null, roles: ['USER'], specialistType: null,
    department: null, position: null, isSpecialist: false,
    averageRating: null, ratedTicketsCount: null, createdAt: '2026-09-23T10:00:00Z',
  };
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
  calls.result = { data: wireUser };
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
  calls.result = { data: wireUser };
  await adminApi.updateDepartmentAndPosition(5, null, null);
  expect(calls.requests[0]).toMatchObject({
    url: '/api/v1/admin/users/5/department-position', method: 'PATCH',
    params: { departmentId: '', positionId: '' },
  });
});

it.each([
  ['getUsers', () => adminApi.getUsers(0, 20)],
  ['getUsersByRole', () => adminApi.getUsersByRole('USER', 0, 20)],
] as const)('admin %s maps every paginated user to the public socialNetworks field', async (_operation, invoke) => {
  calls.result = { data: { content: [wireUser], number: 0, size: 20, totalElements: 1, totalPages: 1 } };
  const user = (await invoke()).content[0];
  expect(user.socialNetworks).toEqual({ bitrixUserId: 42, vkId: null, maxId: 9 });
  expect(user).not.toHaveProperty('socialNetwork');
});

it.each([
  ['getUser', () => adminApi.getUser(5)],
  ['createUser', () => adminApi.createUser({ username: 'new', password: 'pass', fio: 'New User', email: null, roles: ['USER'], active: true, departmentId: null, positionId: null })],
  ['updateRoles', () => adminApi.updateRoles(5, ['USER'])],
  ['updateFio', () => adminApi.updateFio(5, 'New User')],
  ['toggleActive', () => adminApi.toggleActive(5, true)],
  ['updateSpecialistType', () => adminApi.updateSpecialistType(5, null)],
  ['updateDepartmentAndPosition', () => adminApi.updateDepartmentAndPosition(5, null, null)],
] as const)('admin %s returns the public socialNetworks field', async (_operation, invoke) => {
  calls.result = { data: wireUser };
  const user = await invoke();
  expect(user.socialNetworks).toEqual({ bitrixUserId: 42, vkId: null, maxId: 9 });
  expect(user).not.toHaveProperty('socialNetwork');
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
