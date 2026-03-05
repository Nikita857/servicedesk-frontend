export interface DepartmentRef {
  id: number;
  name: string;
}

export interface WikiArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  categoryId: number | null;
  categoryName: string | null;
  departments: DepartmentRef[];
  tags: string[];
  createdBy: {
    id: number;
    username: string;
    fio: string | null;
    avatarUrl: string | null;
    isSpecialist: boolean;
  };
  updatedBy: {
    id: number;
    username: string;
    fio: string | null;
    avatarUrl: string | null;
    isSpecialist: boolean;
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
  departments: DepartmentRef[];
  parentId: number | null;
  depth: number | null;
  displayOrder: number | null;
  children: WikiCategory[];
}

export interface WikiCategoryTree {
  id: number;
  name: string;
  description: string | null;
  departments: DepartmentRef[];
  parentId: number | null;
  depth: number | null;
  displayOrder: number | null;
  children: WikiCategoryTree[];
}

export interface WikiCategoryWithArticles {
  id: number;
  name: string;
  description: string | null;
  departments: DepartmentRef[];
  parentId: number | null;
  depth: number | null;
  displayOrder: number | null;
  article: WikiArticleListItem[];
  children: WikiCategoryWithArticles[];
}

export interface WikiArticleListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryName: string | null;
  departments: DepartmentRef[];
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

export interface CreateWikiCategoryRequest {
  name: string;
  description?: string;
  departmentIds?: number[];
  parentId?: number | null;
  displayOrder?: number;
}

export interface UpdateWikiCategoryRequest {
  name?: string;
  description?: string;
  departmentIds?: number[] | null;
  parentId?: number | null;
  displayOrder?: number;
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

export interface PagedWikiCategoryList {
  content: WikiCategoryWithArticles[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface WikiArticleSuggestion {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
}

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
