export interface CategoryResponse {
  id: number;
  name: string;
  is1ClinkRecommended: boolean | null;
}

export interface CategoryDetailResponse {
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
