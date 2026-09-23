import type { User } from '@/types/auth';
import type { UserAuthResponse } from './generated/models';

/** Adapt the serialized UserAuthResponse to the public auth/admin user view. */
export function toUserView(wire: UserAuthResponse | undefined): User {
  if (!wire || wire.id == null || wire.username == null || wire.socialNetwork == null ||
      wire.specialist == null || wire.roles == null || wire.permissions == null || wire.active == null) {
    throw new Error('User response is missing required data');
  }

  return {
    id: wire.id,
    username: wire.username,
    fio: wire.fio ?? null,
    socialNetworks: {
      bitrixUserId: wire.socialNetwork.bitrixUserId ?? null,
      vkId: wire.socialNetwork.vkId ?? null,
      maxId: wire.socialNetwork.maxId ?? null,
    },
    avatarUrl: wire.avatarUrl ?? null,
    specialist: wire.specialist,
    roles: wire.roles,
    permissions: wire.permissions,
    specialistType: wire.specialistType ?? null,
    departmentName: wire.departmentName ?? null,
    positionName: wire.positionName ?? null,
    active: wire.active,
  };
}
