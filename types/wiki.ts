import type {
  AttachmentResponse as WireAttachment,
  CreateWikiArticleRequest as WireCreateArticle,
  CreateWikiCategoryRequest as WireCreateCategory,
  DepartmentRef as WireDepartment,
  UpdateWikiCategoryRequest as WireUpdateCategory,
  UserShortResponse as WireUser,
  WikiArticleListResponse as WireArticleList,
  WikiArticleResponse as WireArticle,
  WikiArticleSuggestionDto as WireSuggestion,
  WikiCategoryResponse as WireCategory,
  WikiCategoryWithArticlesTreeResponse as WireTree,
} from '@/lib/api/generated/models';
import type { PaginatedResponse } from './api';

export type DepartmentRef = Required<WireDepartment>;
export type WikiArticle = Omit<Required<WireArticle>,
  'excerpt' | 'categoryId' | 'categoryName' | 'createdBy' | 'updatedBy' | 'departments'> & {
  excerpt: string | null;
  categoryId: number | null;
  categoryName: string | null;
  createdBy: Required<WireUser>;
  updatedBy: Required<WireUser> | null;
  departments: DepartmentRef[];
};
export type WikiCategory = Omit<Required<WireCategory>,
  'description' | 'parentId' | 'depth' | 'displayOrder' | 'children' | 'departments'> & {
  description: string | null;
  parentId: number | null;
  depth: number | null;
  displayOrder: number | null;
  children: WikiCategory[];
  departments: DepartmentRef[];
};
export type WikiCategoryTree = WikiCategory;
export type WikiArticleListItem = Omit<Required<WireArticleList>,
  'excerpt' | 'categoryName' | 'author' | 'departments'> & {
  excerpt: string | null;
  categoryName: string | null;
  author: (Pick<Required<WireUser>, 'id' | 'username' | 'isSpecialist'> & {
    fio: string | null;
    avatarUrl: string | null;
    color: string | null;
  }) | null;
  departments: DepartmentRef[];
};
export type WikiCategoryWithArticles = Omit<Required<WireTree>,
  'description' | 'parentId' | 'depth' | 'displayOrder' | 'article' | 'children' | 'departments'> & {
  description: string | null;
  parentId: number | null;
  depth: number | null;
  displayOrder: number | null;
  article: WikiArticleListItem[];
  children: WikiCategoryWithArticles[];
  departments: DepartmentRef[];
};

// Form state allows an unselected category. The adapter validates it before
// calling the generated request, whose categoryId is required.
export type CreateWikiArticleRequest = Omit<WireCreateArticle, 'categoryId'> & { categoryId?: number };
export type { UpdateWikiArticleRequest } from '@/lib/api/generated/models';
export type CreateWikiCategoryRequest = Omit<WireCreateCategory, 'parentId'> & { parentId?: number | null };
export type UpdateWikiCategoryRequest = Omit<WireUpdateCategory, 'departmentIds' | 'parentId'> & {
  departmentIds?: number[] | null;
  parentId?: number | null;
};
export type PagedWikiArticleList = PaginatedResponse<WikiArticleListItem>;
export type PagedWikiCategoryList = PaginatedResponse<WikiCategoryWithArticles>;
export type WikiArticleSuggestion = Required<WireSuggestion>;
export type WikiAttachment = Required<WireAttachment>;
