/** Preset admins for the login picker. Labels are shown without email in the UI. */
export const PRESET_ADMIN_ACCOUNTS = [
  {
    label: "AD",
    email: "ardadinc04@gmail.com",
  },
  {
    label: "YanLeCunn",
    email: "luanthony523@gmail.com",
  },
  {
    label: "Tim",
    email: "yanzewu88@gmail.com",
  },
] as const;

export const PRESET_ADMIN_EMAILS = PRESET_ADMIN_ACCOUNTS.map((admin) => admin.email);
