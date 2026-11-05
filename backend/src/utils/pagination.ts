export type PageQuery = { page: number; limit: number };

export type Paged<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export const toSkip = ({ page, limit }: PageQuery) => (page - 1) * limit;

export const paged = <T>(items: T[], total: number, q: PageQuery): Paged<T> => ({
  items,
  page: q.page,
  limit: q.limit,
  total,
});
