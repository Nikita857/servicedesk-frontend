import { ApiResponse } from "@/types/api";
import {
  DepartmentResponse,
  PositionResponse,
  CreateDepartmentRequest,
  CreatePositionRequest,
} from "@/types/department";
import api from "./client";

export const departmentApi = {
  // === Departments (Отделы) ===

  // Получить все отделы
  getDepartments: async (): Promise<DepartmentResponse[]> => {
    const response =
      await api.get<ApiResponse<DepartmentResponse[]>>("/departments");
    return response.data.data;
  },

  // Получить отдел по ID
  getDepartmentById: async (id: number): Promise<DepartmentResponse> => {
    const response = await api.get<ApiResponse<DepartmentResponse>>(
      `/departments/${id}`,
    );
    return response.data.data;
  },

  // Создать отдел
  createDepartment: async (
    request: CreateDepartmentRequest,
  ): Promise<DepartmentResponse> => {
    const response = await api.post<ApiResponse<DepartmentResponse>>(
      "/departments",
      request,
    );
    return response.data.data;
  },

  // Обновить отдел
  updateDepartment: async (
    id: number,
    request: CreateDepartmentRequest,
  ): Promise<DepartmentResponse> => {
    const response = await api.put<ApiResponse<DepartmentResponse>>(
      `/departments/${id}`,
      request,
    );
    return response.data.data;
  },

  // Удалить отдел
  deleteDepartment: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/departments/${id}`);
  },

  // === Positions (Должности) ===

  // Получить все должности
  getAllPositions: async (): Promise<PositionResponse[]> => {
    const response = await api.get<ApiResponse<PositionResponse[]>>(
      "/departments/positions",
    );
    return response.data.data;
  },

  // Получить должности конкретного отдела
  getPositionsByDepartment: async (
    departmentId: number,
  ): Promise<PositionResponse[]> => {
    const response = await api.get<ApiResponse<PositionResponse[]>>(
      `/departments/${departmentId}/positions`,
    );
    return response.data.data;
  },

  // Создать должность
  createPosition: async (
    request: CreatePositionRequest,
  ): Promise<PositionResponse> => {
    const response = await api.post<ApiResponse<PositionResponse>>(
      "/departments/positions",
      request,
    );
    return response.data.data;
  },

  // Удалить должность
  deletePosition: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/departments/positions/${id}`);
  },
};
