import type { CategoryDetailResponse, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category';
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const categoriesApi = {
  getUserSelectable: async (): Promise<CategoryDetailResponse[]> => (await generated.getUserSelectableCategories()).data as CategoryDetailResponse[],
  getAll: async (): Promise<CategoryDetailResponse[]> => (await generated.getAllCategories()).data as CategoryDetailResponse[],
  getDetail: async (id: number): Promise<CategoryDetailResponse> => (await generated.getCategory(id)).data as CategoryDetailResponse,
  create: async (data: CreateCategoryRequest): Promise<CategoryDetailResponse> => (await generated.createCategory(data)).data as CategoryDetailResponse,
  update: async (id: number, data: UpdateCategoryRequest): Promise<CategoryDetailResponse> => (await generated.updateCategory(id, data)).data as CategoryDetailResponse,
  delete: async (id: number): Promise<void> => { await generated.deleteCategory(id); },
};
