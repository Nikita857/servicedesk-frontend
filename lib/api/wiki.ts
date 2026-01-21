import api from "./client";
import type { ApiResponse } from "@/types/api";

// Types based on OpenAPI spec
export interface WikiArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  categoryId: number | null;
  categoryName: string | null;
  departmentName: string | null;
  tags: string[];
  createdBy: {
    id: number;
    username: string;
    fio: string | null;
  };
  updatedBy: {
    id: number;
    username: string;
    fio: string | null;
  } | null;
  viewCount: number;
  likeCount: number;
  likedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WikiCategory {
  id: number;
  name: string;
  description: string | null;
  departmentId: number | null;
  departmentName: string | null;
  displayOrder: number;
}

export interface CreateWikiCategoryRequest {
  name: string;
  description?: string;
  departmentId?: number | null;
  displayOrder?: number;
}

export interface UpdateWikiCategoryRequest {
  name?: string;
  description?: string;
  departmentId?: number | null;
  displayOrder?: number;
}

export interface WikiArticleListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryName: string | null;
  departmentName: string | null;
  tags: string[];
  author: {
    id: number;
    username: string;
    fio: string | null;
    avatarUrl: string | null;
    isSpecialist: boolean;
  } | null;
  viewCount: number;
  likeCount: number;
  likedByCurrentUser: boolean;
  updatedAt: string;
}

export interface CreateWikiArticleRequest {
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: number;
  tags?: string[];
}

export interface UpdateWikiArticleRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  categoryId?: number;
  tags?: string[];
}

export interface PagedWikiArticleList {
  content: WikiArticleListItem[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export const wikiApi = {
  // List all articles (paginated)
  list: async (
    page = 0,
    size = 20,
    showAll = false,
    onlyMyDepartment = false,
    onlyPublic = false,
  ): Promise<PagedWikiArticleList> => {
    const response = await api.get<ApiResponse<PagedWikiArticleList>>("/wiki", {
      params: { page, size, showAll, onlyMyDepartment, onlyPublic },
    });
    return response.data.data;
  },

  // Get article by slug
  getBySlug: async (slug: string): Promise<WikiArticle> => {
    const response = await api.get<ApiResponse<WikiArticle>>(`/wiki/${slug}`);
    return response.data.data;
  },

  // Create new article
  create: async (data: CreateWikiArticleRequest): Promise<WikiArticle> => {
    const response = await api.post<ApiResponse<WikiArticle>>("/wiki", data);
    return response.data.data;
  },

  // Update article
  update: async (
    id: number,
    data: UpdateWikiArticleRequest,
  ): Promise<WikiArticle> => {
    const response = await api.put<ApiResponse<WikiArticle>>(
      `/wiki/${id}`,
      data,
    );
    return response.data.data;
  },

  // Delete article
  delete: async (id: number): Promise<void> => {
    await api.delete(`/wiki/${id}`);
  },

  // Like article
  like: async (id: number): Promise<void> => {
    await api.post(`/wiki/${id}/like`);
  },

  // Unlike article (remove like)
  unlike: async (id: number): Promise<void> => {
    await api.delete(`/wiki/${id}/like`);
  },

  // Search articles
  search: async (
    query: string,
    page = 0,
    size = 20,
    showAll = false,
  ): Promise<PagedWikiArticleList> => {
    const response = await api.get<ApiResponse<PagedWikiArticleList>>(
      "/wiki/search",
      {
        params: { q: query, page, size, showAll },
      },
    );
    return response.data.data;
  },

  // Get popular articles
  getPopular: async (
    page = 0,
    size = 10,
    showAll = false,
  ): Promise<PagedWikiArticleList> => {
    const response = await api.get<ApiResponse<PagedWikiArticleList>>(
      "/wiki/popular",
      {
        params: { page, size, showAll },
      },
    );
    return response.data.data;
  },

  // Get articles by category
  getByCategory: async (
    categoryId: number,
    page = 0,
    size = 20,
  ): Promise<PagedWikiArticleList> => {
    const response = await api.get<ApiResponse<PagedWikiArticleList>>(
      `/wiki/category/${categoryId}`,
      {
        params: { page, size },
      },
    );
    return response.data.data;
  },

  // ============ Attachments ============

  // Get attachments for article
  getAttachments: async (articleId: number): Promise<WikiAttachment[]> => {
    const response = await api.get<ApiResponse<WikiAttachment[]>>(
      `/wiki/${articleId}/attachments`,
    );
    return response.data.data;
  },

  // Get wiki categories
  getCategories: async (showAll = false): Promise<WikiCategory[]> => {
    const response = await api.get<ApiResponse<WikiCategory[]>>(
      "/wiki/categories",
      {
        params: { showAll },
      },
    );
    return response.data.data;
  },

  // ============ Admin: Wiki Category Management ============

  adminGetCategories: async (): Promise<WikiCategory[]> => {
    const response = await api.get<ApiResponse<WikiCategory[]>>(
      "/admin/wiki/categories",
    );
    return response.data.data;
  },

  adminGetCategory: async (id: number): Promise<WikiCategory> => {
    const response = await api.get<ApiResponse<WikiCategory>>(
      `/admin/wiki/categories/${id}`,
    );
    return response.data.data;
  },

  adminCreateCategory: async (
    data: CreateWikiCategoryRequest,
  ): Promise<WikiCategory> => {
    const response = await api.post<ApiResponse<WikiCategory>>(
      "/admin/wiki/categories",
      data,
    );
    return response.data.data;
  },

  adminUpdateCategory: async (
    id: number,
    data: UpdateWikiCategoryRequest,
  ): Promise<WikiCategory> => {
    const response = await api.put<ApiResponse<WikiCategory>>(
      `/admin/wiki/categories/${id}`,
      data,
    );
    return response.data.data;
  },

  adminDeleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/admin/wiki/categories/${id}`);
  },
};

// Attachment type
export interface WikiAttachment {
  id: number;
  filename: string;
  url: string;
  fileSize: number;
  mimeType: string;
  type: "PHOTO" | "SCREENSHOT" | "DOCUMENT" | "VIDEO";
  uploadedById: number;
  uploadedByUsername: string;
  createdAt: string;
}
