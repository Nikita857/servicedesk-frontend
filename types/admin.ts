import { SocialNetworks } from "./profile";

export interface AdminUserResponse {
  id: number;
  fio: string | null;
  username: string;
  avatarUrl: string | null;
  socialNetworks: SocialNetworks;
  specialist: boolean;
  specialistType?: string | null;
  departmentName: string | null;
  positionName: string | null;
  roles: string[];
  active: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fio: string;
  email: string | null;
  roles: string[] | null;
  active: boolean;
  departmentId: number | null;
  positionId: number | null;
}
