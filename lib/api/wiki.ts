import api from './client';
import type { ApiResponse } from '@/types/api';

// Types based on OpenAPI spec
export interface WikiArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  categoryId: number | null;
  categoryName: string | null;
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

export interface WikiArticleListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryName: string | null;
  tags: string[];
  authorName: string | null;
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
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const wikiApi = {
  // List all articles (paginated)
  list: async (page = 0, size = 20): Promise<PagedWikiArticleList> => {
    const response = await api.get<ApiResponse<PagedWikiArticleList>>('/wiki', {
      params: { page, size },
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
    const response = await api.post<ApiResponse<WikiArticle>>('/wiki', data);
    return response.data.data;
  },

  // Update article
  update: async (id: number, data: UpdateWikiArticleRequest): Promise<WikiArticle> => {
    const response = await api.put<ApiResponse<WikiArticle>>(`/wiki/${id}`, data);
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
  search: async (query: string, page = 0, size = 20): Promise<PagedWikiArticleList> => {
    const response = await api.get<ApiResponse<PagedWikiArticleList>>('/wiki/search', {
      params: { q: query, page, size },
    });
    return response.data.data;
  },

  // Get popular articles
  getPopular: async (page = 0, size = 10): Promise<PagedWikiArticleList> => {
    const response = await api.get<ApiResponse<PagedWikiArticleList>>('/wiki/popular', {
      params: { page, size },
    });
    return response.data.data;
  },

  // Get articles by category
  getByCategory: async (categoryId: number, page = 0, size = 20): Promise<PagedWikiArticleList> => {
    const response = await api.get<ApiResponse<PagedWikiArticleList>>(`/wiki/category/${categoryId}`, {
      params: { page, size },
    });
    return response.data.data;
  },
};
