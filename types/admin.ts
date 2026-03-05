import { SenderType } from "@/types/auth";

export interface AdminUserResponse {
  id: number;
  fio: string | null;
  username: string;
  avatarUrl: string | null;
  telegramId: number | null;
  specialist: boolean;
  departmentName: string | null;
  positionName: string | null;
  roles: string[];
  active: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fio: string | null;
  email: string | null;
  roles: SenderType[] | null;
  active: boolean;
  departmentId: number | null;
  positionId: number | null;
}

export interface DepartmentResponse {
  id: number;
  name: string;
  description: string | null;
  positionCount: number;
}

export interface PositionResponse {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
}
