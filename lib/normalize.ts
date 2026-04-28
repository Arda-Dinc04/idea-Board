export function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function cleanDisplayName(name?: string) {
  const cleaned = name?.trim();
  return cleaned && cleaned.length > 0 ? cleaned : "Anonymous";
}
