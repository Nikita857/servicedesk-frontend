import type {
  AnnouncementDetailResponse as WireDetail,
  AnnouncementManagementResponse as WireManagement,
  MyAnnouncementResponse as WireMine,
} from '@/lib/api/generated/models';

export type { CreateAnnouncementRequest } from '@/lib/api/generated/models';

// These view types retain the UI's non-optional fields while their wire fields
// and enum values come from the generated contract.
export type MyAnnouncementResponse = Omit<Required<WireMine>, 'expiresAt'> & { expiresAt: string | null };
export type AnnouncementDetailResponse = Omit<Required<WireDetail>, 'expiresAt'> & { expiresAt: string | null };
export type AnnouncementManagementResponse = Omit<Required<WireManagement>, 'expiresAt' | 'archivedAt'> & {
  expiresAt: string | null;
  archivedAt: string | null;
};
