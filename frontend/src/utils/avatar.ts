import { apiUrl } from "../api/config";

export function getAvatarSrc(avatarUrl: string | null) {
  if (!avatarUrl) return "";

  if (avatarUrl.startsWith("http")) {
    return avatarUrl;
  }

  return apiUrl(avatarUrl);
}
