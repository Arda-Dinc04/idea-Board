export const PRESET_ADMIN_ACCOUNTS = [
  {
    label: "Arda",
    email: "ardadinc04@gmail.com",
  },
  {
    label: "David",
    email: "luanthony523@gmail.com",
  },
  {
    label: "Timur",
    email: "yanzewu88@gmail.com",
  },
] as const;

export const PRESET_ADMIN_EMAILS = PRESET_ADMIN_ACCOUNTS.map((admin) => admin.email);
