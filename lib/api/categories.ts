import api from "./client";
import type { CategoryDetailResponse, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category";

export const categoriesApi = {
  getUserSelectable: async (): Promise<CategoryDetailResponse[]> => {
    const response = await api.get("/categories/user-selectable");
    return response.data.data;
  },

  getAll: async (): Promise<CategoryDetailResponse[]> => {
    const response = await api.get("/categories");
    return response.data.data;
  },

  getDetail: async (id: number): Promise<CategoryDetailResponse> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  },

  create: async (data: CreateCategoryRequest): Promise<CategoryDetailResponse> => {
    const response = await api.post("/categories", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateCategoryRequest): Promise<CategoryDetailResponse> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
