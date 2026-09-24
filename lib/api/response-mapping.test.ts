import { beforeEach, expect, it, vi } from 'vitest';

const wire = vi.hoisted(() => ({ result: undefined as unknown }));
vi.mock('./mutator', () => ({ customInstance: async () => wire.result }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: { getState: () => ({}) } }));
vi.mock('@/lib/utils', () => ({ toast: { warning: vi.fn() } }));

import { profileApi } from './profile';
import { attachmentApi } from './attachments';
import { userApi } from './users';

beforeEach(() => { wire.result = { success: true, data: {} }; });

it('maps a generated profile into the nullable public view without leaking wire-only fields', async () => {
  wire.result = { success: true, data: {
    id: 3, username: 'alice', roles: ['USER'], isSpecialist: false,
    socialNetwork: { bitrixUserId: 42 }, createdAt: '2026-09-23T10:00:00Z',
    permissions: ['PERM_TICKET_READ'],
  } };

  await expect(profileApi.getProfile()).resolves.toEqual({
    id: 3, username: 'alice', fio: null, email: null,
    socialNetwork: { bitrixUserId: 42, vkId: null, maxId: null },
    avatarUrl: null, roles: ['USER'], specialistType: null,
    department: null, position: null, isSpecialist: false,
    averageRating: null, ratedTicketsCount: null, createdAt: '2026-09-23T10:00:00Z',
  });
});

it('rejects a profile without the required public identity', async () => {
  wire.result = { success: true, data: { username: 'alice' } };
  await expect(profileApi.getProfile()).rejects.toThrow('Profile response is missing required data');
});

it('rejects a missing avatar URL instead of returning undefined as a string', async () => {
  wire.result = { success: true };
  await expect(profileApi.uploadAvatar(new File(['avatar'], 'avatar.png'))).rejects.toThrow('API response is missing data');
});

it('maps an upload URL to the public shape and requires presigned upload fields', async () => {
  wire.result = { success: true, data: {
    uploadUrl: 'https://storage.example/upload', fileKey: 'key', bucket: 'attachments', filename: 'a.txt',
  } };
  await expect(attachmentApi.getUploadUrl('a.txt', 'text/plain', 'TICKET', 8)).resolves.toEqual({
    uploadUrl: 'https://storage.example/upload', fileKey: 'key', bucket: 'attachments',
  });
  wire.result = { success: true, data: { uploadUrl: 'https://storage.example/upload', bucket: 'attachments' } };
  await expect(attachmentApi.getUploadUrl('a.txt', 'text/plain', 'TICKET', 8)).rejects.toThrow('Upload URL response is missing required data');
});

it('maps attachment metadata and nullable uploader name without leaking wire-only IDs', async () => {
  wire.result = { success: true, data: {
    id: 12, filename: 'a.txt', url: '/files/a.txt', fileSize: 5, mimeType: 'text/plain',
    type: 'DOCUMENT', ticketId: 8, messageId: null,
    uploadedBy: { id: 2, username: 'alice' }, createdAt: '2026-09-23T10:00:00Z',
  } };
  await expect(attachmentApi.confirmUpload({
    fileKey: 'key', filename: 'a.txt', contentType: 'text/plain', fileSize: 5,
    bucket: 'attachments', targetType: 'TICKET', targetId: 8,
  })).resolves.toEqual({
    id: 12, filename: 'a.txt', url: '/files/a.txt', fileSize: 5, mimeType: 'text/plain',
    type: 'DOCUMENT', uploadedBy: { id: 2, username: 'alice', fio: null },
    createdAt: '2026-09-23T10:00:00Z',
  });
});

it('rejects incomplete multipart initiation metadata', async () => {
  wire.result = { success: true, data: { fileKey: 'key', bucket: 'attachments' } };
  await expect(attachmentApi.initiateMultipart({
    filename: 'a.txt', contentType: 'text/plain', targetType: 'TICKET', targetId: 8,
  })).rejects.toThrow('Multipart initiation response is missing required data');
});

it('maps user search results and status responses through checked public views', async () => {
  wire.result = { success: true, data: { content: [{ id: 2, username: 'alice' }] } };
  await expect(userApi.search('alice')).resolves.toEqual([{ id: 2, username: 'alice', fio: '' }]);
  wire.result = { success: true, data: { status: 'AVAILABLE', availableForAssignment: true } };
  await expect(userApi.getMyStatus()).rejects.toThrow('User status response is missing required data');
});
