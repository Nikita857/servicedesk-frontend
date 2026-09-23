export type { CreateDepartmentRequest, CreatePositionRequest } from '@/lib/api/generated/models';

export interface DepartmentResponse {
  id: number;
  name: string;
  description: string;
  positionCount?: number;
}

export interface PositionResponse {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
}
