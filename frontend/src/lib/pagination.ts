export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const HOME_PAGE_SIZE = 9;
export const HOME_PAGE_SIZE_OPTIONS = [9, 18, 36] as const;

type SearchParamValue = string | string[] | null | undefined;

function getFirstValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function parsePageParam(value: SearchParamValue): number {
  const parsed = Number(getFirstValue(value));
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export function parsePageSizeParam(
  value: SearchParamValue,
  options: readonly number[],
  fallback: number,
): number {
  const parsed = Number(getFirstValue(value));
  return Number.isInteger(parsed) && options.some((option) => option === parsed)
    ? parsed
    : fallback;
}

export function createPaginationHref(
  pathname: string,
  currentSearchParams: string,
  page: number,
  pageSize: number,
  defaultPageSize: number,
): string {
  const params = new URLSearchParams(currentSearchParams);
  const nextPage = Math.max(1, Math.trunc(page));

  if (nextPage === 1) {
    params.delete("page");
  } else {
    params.set("page", String(nextPage));
  }

  if (pageSize === defaultPageSize) {
    params.delete("pageSize");
  } else {
    params.set("pageSize", String(pageSize));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
