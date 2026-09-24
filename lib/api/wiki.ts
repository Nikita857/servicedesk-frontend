import { getServiceDeskAPI } from './generated/client';
import { toPage } from './page';
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
} from "@/types/wiki";
import type { WikiArticleListResponse as WireArticleList } from './generated/models';

const generated = getServiceDeskAPI();

function required<T>(value: T | undefined, field: string): T {
  if (value === undefined) throw new Error(`Wiki article is missing ${field}`);
  return value;
}

function toWikiArticleListItem(article: WireArticleList): WikiArticleListItem {
  return {
    id: required(article.id, 'id'),
    title: required(article.title, 'title'),
    slug: required(article.slug, 'slug'),
    excerpt: article.excerpt ?? null,
    categoryName: article.categoryName ?? null,
    departments: (article.departments ?? []).map(department => ({
      id: required(department.id, 'department.id'),
      name: required(department.name, 'department.name'),
    })),
    tags: required(article.tags, 'tags'),
    author: article.author ? {
      id: required(article.author.id, 'author.id'),
      username: required(article.author.username, 'author.username'),
      fio: article.author.fio ?? null,
      avatarUrl: article.author.avatarUrl ?? null,
      isSpecialist: required(article.author.isSpecialist, 'author.isSpecialist'),
      color: article.author.color ?? null,
    } : null,
    viewCount: required(article.viewCount, 'viewCount'),
    likeCount: required(article.likeCount, 'likeCount'),
    likedByCurrentUser: required(article.likedByCurrentUser, 'likedByCurrentUser'),
    updatedAt: required(article.updatedAt, 'updatedAt'),
  };
}

export const wikiApi = {
  // List all categories with articles (paginated)
  listCategories: async (
    page = 0,
    size = 5,
    showAll = false,
    onlyMyDepartment = false,
    onlyPublic = false,
  ): Promise<PagedWikiCategoryList> => {
    return toPage((await generated.getAllArticlesAsTree({ pageable: { page, size }, showAll, onlyMyDepartment, onlyPublic })).data) as PagedWikiCategoryList;
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
    void onlyMyDepartment; void onlyPublic;
    const categories = (await generated.search({ q: query, pageable: { page, size }, showAll })).data as WikiCategoryWithArticles[];
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
    const categoryPage = (await generated.getAllArticles({ pageable: { page, size }, showAll, onlyMyDepartment, onlyPublic })).data;
    // This legacy adapter flattens a page of categories, so page metadata describes categories, not articles.
    const pageOfCategories = toPage(categoryPage);
    return {
      content: pageOfCategories.content.flatMap(category => (category.children ?? []).map(toWikiArticleListItem)),
      page: pageOfCategories.page,
    };
  },

  // Get article by slug
  getBySlug: async (slug: string): Promise<WikiArticle> => {
    return (await generated.getBySlug(slug)).data as WikiArticle;
  },

  // Create new article
  create: async (data: CreateWikiArticleRequest): Promise<WikiArticle> => {
    if (data.categoryId == null) throw new Error('Category is required');
    return (await generated.createArticle({ ...data, categoryId: data.categoryId })).data as WikiArticle;
  },

  // Update article
  update: async (
    id: number,
    data: UpdateWikiArticleRequest,
  ): Promise<WikiArticle> => {
    return (await generated.updateArticle(id, data)).data as WikiArticle;
  },

  // Delete article
  delete: async (id: number): Promise<void> => {
    await generated.deleteArticle(id);
  },

  // Like article
  like: async (id: number): Promise<void> => {
    await generated.likeArticle(id);
  },

  // Unlike article (remove like)
  unlike: async (id: number): Promise<void> => {
    await generated.unlikeArticle(id);
  },

  // Search articles
  search: async (
    query: string,
    page = 0,
    size = 20,
    showAll = false,
  ): Promise<PagedWikiArticleList> => {
    const categories = (await generated.search({ q: query, pageable: { page, size }, showAll })).data;
    return {
      content: categories?.flatMap(category => category.article ?? []) ?? [],
      page: { number: page, size, totalElements: categories?.length ?? 0, totalPages: 1 },
    } as PagedWikiArticleList;
  },

  // Get popular articles
  getPopular: async (
    page = 0,
    size = 10,
    showAll = false,
  ): Promise<PagedWikiArticleList> => {
    return toPage((await generated.getPopularArticles({ pageable: { page, size }, showAll })).data) as PagedWikiArticleList;
  },

  // Get articles by category
  getByCategory: async (
    categoryId: number,
    page = 0,
    size = 20,
  ): Promise<PagedWikiArticleList> => {
    return toPage((await generated.getByCategory(categoryId, { pageable: { page, size } })).data) as PagedWikiArticleList;
  },

  // ============ Attachments ============

  // Get attachments for article
  getAttachments: async (articleId: number): Promise<WikiAttachment[]> => {
    return (await generated.getWikiArticleAttachments(articleId)).data as WikiAttachment[];
  },

  // Get wiki categories
  getCategories: async (showAll = false): Promise<WikiCategory[]> => {
    return (await generated.getCategories({ showAll })).data as WikiCategory[];
  },

  // Autocomplete for wiki search
  autocomplete: async (query: string): Promise<string[]> => {
    return (await generated.autocomplete({ q: query })).data as string[];
  },

  // Search suggestions with title + excerpt
  suggest: async (q: string, limit = 5): Promise<WikiArticleSuggestion[]> => {
    return (await generated.suggest({ q, limit })).data as WikiArticleSuggestion[];
  },

  // ============ Admin: Wiki Category Management ============

  adminGetCategories: async (): Promise<WikiCategory[]> => {
    return (await generated.getAllCategories1()).data as WikiCategory[];
  },

  adminGetCategory: async (id: number): Promise<WikiCategory> => {
    return (await generated.getCategory1(id)).data as WikiCategory;
  },

  adminCreateCategory: async (
    data: CreateWikiCategoryRequest,
  ): Promise<WikiCategory> => {
    return (await generated.createCategory1({ ...data, parentId: data.parentId ?? undefined })).data as WikiCategory;
  },

  adminUpdateCategory: async (
    id: number,
    data: UpdateWikiCategoryRequest,
  ): Promise<WikiCategory> => {
    return (await generated.updateCategory1(id, {
      ...data,
      departmentIds: data.departmentIds ?? undefined,
      parentId: data.parentId ?? undefined,
    })).data as WikiCategory;
  },

  adminDeleteCategory: async (id: number): Promise<void> => {
    await generated.deleteCategory1(id);
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
