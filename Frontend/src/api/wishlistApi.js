import { apiFetch } from "./mediaApi";

export async function getMyWishlist({ signal } = {}) {
  const result = await apiFetch("/wishlist", { signal });
  return result.data.items || [];
}

export async function addToWishlist(contentId) {
  const result = await apiFetch(`/wishlist/${encodeURIComponent(contentId)}`, {
    method: "PUT",
  });
  return result.data;
}

export async function removeFromWishlist(contentId) {
  const result = await apiFetch(`/wishlist/${encodeURIComponent(contentId)}`, {
    method: "DELETE",
  });
  return result.data;
}
