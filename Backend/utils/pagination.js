export function getPagination(
  query,
  { defaultLimit, maxLimit },
) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit),
  );
  return { page, limit, skip: (page - 1) * limit };
}
