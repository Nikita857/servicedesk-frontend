import api from "./client";

export interface Category {
  id: number;
  name: string;
  description?: string;
  type?: "GENERAL" | "HIDDEN" | "ESCALATION" | "SYSTEM";
  displayOrder?: number;
  userSelectable?: boolean;
  recommendedLineId?: number | null;
  recommendedLineName?: string | null;
  is1ClinkRecommended?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const categoriesApi = {
  /**
   * Fetch user-selectable categories for ticket creation
   */
  getUserSelectable: async (): Promise<Category[]> => {
    const response = await api.get("/categories/user-selectable");
    return response.data.data;
  },

  /**
   * Fetch detailed information about a category
   */
  getDetail: async (id: number): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  },
};

export default categoriesApi;
