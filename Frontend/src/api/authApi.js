import { publicApiFetch } from "./mediaApi.js";

export async function logoutFromApi() {
  await publicApiFetch(
    "/auth/logout",
    { method: "POST", credentials: "include" },
    "Logout failed",
  );
}
