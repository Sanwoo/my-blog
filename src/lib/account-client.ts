export const ACCOUNT_VIEWER_KEY = "/api/account/viewer";
export const ACCOUNT_PROFILE_KEY = "/api/account/profile";
export const ACCOUNT_AVATAR_KEY = "/api/account/profile/avatar";
export const INTERACTION_NOTIFICATIONS_KEY = "/api/account/interaction-notifications";
export const INTERACTION_NOTIFICATION_SUMMARY_KEY = "/api/account/interaction-notifications?summary=1";
export const INTERACTION_NOTIFICATIONS_READ_KEY = "/api/account/interaction-notifications/read";

export function isCommentsSwrKey(key: unknown) {
  return typeof key === "string" && key.startsWith("/api/comments?");
}

export function isIdentityDependentSwrKey(key: unknown) {
  return key === INTERACTION_NOTIFICATIONS_KEY ||
    key === INTERACTION_NOTIFICATION_SUMMARY_KEY ||
    isCommentsSwrKey(key);
}
