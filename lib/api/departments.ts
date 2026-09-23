import type { DepartmentResponse, PositionResponse, CreateDepartmentRequest, CreatePositionRequest } from '@/types/department';
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const departmentApi = {
  getDepartments: async (): Promise<DepartmentResponse[]> => (await generated.getAllDepartments()).data as DepartmentResponse[],
  getDepartmentById: async (id: number): Promise<DepartmentResponse> => (await generated.getDepartment(id)).data as DepartmentResponse,
  createDepartment: async (request: CreateDepartmentRequest): Promise<DepartmentResponse> => (await generated.createDepartment(request)).data as DepartmentResponse,
  updateDepartment: async (id: number, request: CreateDepartmentRequest): Promise<DepartmentResponse> => (await generated.updateDepartment(id, request)).data as DepartmentResponse,
  deleteDepartment: async (id: number): Promise<void> => { await generated.deleteDepartment(id); },
  getAllPositions: async (): Promise<PositionResponse[]> => (await generated.getAllPositions()).data as PositionResponse[],
  getPositionsByDepartment: async (departmentId: number): Promise<PositionResponse[]> => (await generated.getPositions(departmentId)).data as PositionResponse[],
  createPosition: async (request: CreatePositionRequest): Promise<PositionResponse> => (await generated.createPosition(request)).data as PositionResponse,
  deletePosition: async (id: number): Promise<void> => { await generated.deletePosition(id); },
};
