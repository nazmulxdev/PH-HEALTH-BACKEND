/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PrismaFindManyArgs {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | Record<string, unknown>>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  distinct?: string[] | string;
  [key: string]: unknown;
}

export interface PrismaCountArgs {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | Record<string, boolean>>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  distinct?: string[] | string;
  [key: string]: unknown;
}

export interface PrismaModelDelegate {
  findMany(args?: any): Promise<any[]>;
  count(args?: any): Promise<number>;
}

export interface IQueryParams {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  fields?: string;
  include?: string;
  [key: string]: string | undefined;
}

export interface IQueryConfig {
  searchableFields?: string[];
  filterableFields?: string[];
  sortableFields?: string[];
}

export interface PrismaStringFilter {
  contains?: string;
  mode?: "insensitive" | "default";
  startsWith?: string;
  endsWith?: string;
  equals?: string;
  in?: string[];
  notIn?: string[];
  not?: string;
  lt?: string;
  lte?: string;
  gt?: string;
  gte?: string;
  [key: string]: unknown;
}

export interface PrismaNumberFilter {
  equals?: number;
  in?: number[];
  notIn?: number[];
  not?: number;
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
}

export interface PrismaWhereCondition {
  OR?: Record<string, unknown>[];
  AND?: Record<string, unknown>[];
  NOT?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface IQueryResult<I> {
  data: I[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
