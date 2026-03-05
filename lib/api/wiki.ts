import api from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  WikiArticle,
  WikiCategory,
  WikiCategoryTree,
  WikiCategoryWithArticles,
  WikiArticleListItem,
  WikiArticleSuggestion,
  WikiAttachment,
  CreateWikiArticleRequest,
  UpdateWikiArticleRequest,
  CreateWikiCategoryRequest,
  UpdateWikiCategoryRequest,
  PagedWikiArticleList,
  PagedWikiCategoryList,
  DepartmentRef,
} from "@/types/wiki";

export const wikiApi = {
  // List all categories with articles (paginated)
  listCategories: async (
    page = 0,
    size = 5,
    showAll = false,
    onlyMyDepartment = false,
    onlyPublic = false,
  ): Promise<PagedWikiCategoryList> => {
    const response = await api.get<ApiResponse<PagedWikiCategoryList>>("/wiki/tree", {
      params: { page, size, showAll, onlyMyDepartment, onlyPublic },
    });
    return response.data.data;
  },

  // Search categories with articles (paginated)
  searchCategories: async (
    query: string,
    page = 0,
    size = 5,
    showAll = false,
    onlyMyDepartment = false,
    onlyPublic = false,
  ): Promise<PagedWikiCategoryList> => {
    const response = await api.get<ApiResponse<WikiCategoryWithArticles[]>>("/wiki/search", {
      params: { q: query, page, size, showAll, onlyMyDepartment, onlyPublic },
    });

    // API returns array directly, wrap it in paged structure
    const categories = response.data.data;
    return {
      content: categories,
      page: {
        size: size,
        number: page,
        totalElements: categories.length,
        totalPages: 1,
      },
    };
  },

  // List all articles (paginated) - LEGACY, kept for backward compatibility
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

  // Autocomplete for wiki search
  autocomplete: async (query: string): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>(
      "/wiki/autocomplete",
      {
        params: { q: query },
      },
    );
    return response.data.data;
  },

  // Search suggestions with title + excerpt
  suggest: async (q: string, limit = 5): Promise<WikiArticleSuggestion[]> => {
    const response = await api.get<ApiResponse<WikiArticleSuggestion[]>>(
      "/wiki/suggest",
      { params: { q, limit } },
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

export type {
  WikiArticle,
  WikiCategory,
  WikiCategoryTree,
  WikiCategoryWithArticles,
  WikiArticleListItem,
  WikiArticleSuggestion,
  WikiAttachment,
  CreateWikiArticleRequest,
  UpdateWikiArticleRequest,
  CreateWikiCategoryRequest,
  UpdateWikiCategoryRequest,
  PagedWikiCategoryList,
};
