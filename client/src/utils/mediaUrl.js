import api from "../services/api";

export function mediaUrl(url) {
  if (typeof url !== "string" || !url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${api.defaults.baseURL}${url.startsWith("/") ? url : `/${url}`}`;
}
