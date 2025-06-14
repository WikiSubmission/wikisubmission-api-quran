export function parseQueryString(
  queryObject: any,
  paramObject: any,
): string | undefined {
  const raw = queryObject.q || paramObject.q || queryObject.query || paramObject.query;

  if (!raw || typeof raw !== "string") return undefined;

  return decodeURIComponent(raw.replace(/\+/g, " ")).trim();
}