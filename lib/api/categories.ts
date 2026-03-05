import api from "./client";
import type { CategoryDetailResponse } from "@/types/category";

export const categoriesApi = {
  /**
   * Fetch user-selectable categories for ticket creation
   */
  getUserSelectable: async (): Promise<CategoryDetailResponse[]> => {
    const response = await api.get("/categories/user-selectable");
    return response.data.data;
  },

  /**
   * Fetch detailed information about a category
   */
  getDetail: async (id: number): Promise<CategoryDetailResponse> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  },
};
