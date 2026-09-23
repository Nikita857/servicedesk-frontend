export type CategoryType = "GENERAL" | "HIDDEN";

export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  type: CategoryType;
  is1ClinkRecommended: boolean | null;
}

export interface CategoryDetailResponse {
  id: number;
  name: string;
  description?: string;
  type?: CategoryType;
  displayOrder?: number;
  userSelectable?: boolean;
  recommendedLineId?: number | null;
  recommendedLineName?: string | null;
  is1ClinkRecommended?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type { CreateCategoryRequest, UpdateCategoryRequest } from '@/lib/api/generated/models';

export const categoryTypeConfig: Record<CategoryType, { label: string; color: string }> = {
  GENERAL: { label: "Обычная", color: "blue" },
  HIDDEN: { label: "Скрытая", color: "gray" },
};
