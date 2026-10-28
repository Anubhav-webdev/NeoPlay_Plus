import { apiFetch } from "./mediaApi";

export async function getMyPlaylists({ signal } = {}) {
  const result = await apiFetch("/playlists", { signal });
  return result.data.playlists;
}

export async function createPlaylist(name, isPublic = false, description = "") {
  const result = await apiFetch("/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, isPublic, description }),
  });
  return result.data.playlist;
}

export async function updatePlaylist(playlistId, updates) {
  const result = await apiFetch(`/playlists/${encodeURIComponent(playlistId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return result.data.playlist;
}

export async function deletePlaylist(playlistId) {
  await apiFetch(`/playlists/${encodeURIComponent(playlistId)}`, {
    method: "DELETE",
  });
}

export async function removePlaylistContent(playlistId, contentId) {
  const result = await apiFetch(
    `/playlists/${encodeURIComponent(playlistId)}/content/${encodeURIComponent(contentId)}`,
    { method: "DELETE" },
  );
  return result.data.playlist;
}

export async function addPlaylistContent(playlistId, contentId) {
  const result = await apiFetch(
    `/playlists/${encodeURIComponent(playlistId)}/content/${encodeURIComponent(contentId)}`,
    { method: "POST" },
  );
  return result.data.playlist;
}
