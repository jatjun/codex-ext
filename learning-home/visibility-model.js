export const VISIBILITY_KEY = "learning-garden.visibility.v1";
export function readVisibility(storage) {
  try {
    const data = JSON.parse(
      (storage || globalThis.localStorage).getItem(VISIBILITY_KEY) || "{}",
    );
    return data && typeof data === "object" && !Array.isArray(data)
      ? Object.fromEntries(
          Object.entries(data).filter(
            ([k, v]) => typeof k === "string" && v === true,
          ),
        )
      : {};
  } catch {
    return {};
  }
}
export function saveVisibility(current, keys, visible, storage) {
  const next = { ...current };
  for (const key of keys) {
    if (visible) delete next[key];
    else next[key] = true;
  }
  try {
    (storage || globalThis.localStorage).setItem(
      VISIBILITY_KEY,
      JSON.stringify(next),
    );
    return next;
  } catch {
    return null;
  }
}
