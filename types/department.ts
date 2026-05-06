export interface CreateDepartmentRequest {
  name: string;
  description: string;
}

export interface CreatePositionRequest {
  name: string;
  departmentId: number;
}

export interface DepartmentResponse {
  id: number;
  name: string;
  description: string;
  positionCount?: number;
}

export interface PositionResponse {
  id: number;
  name: string;
  departmentId: string;
  departmentName: string;
}
