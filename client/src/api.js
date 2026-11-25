import { getIdToken } from "firebase/auth";
import { auth } from "./firebase/firebase.init";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getAuthHeaders() {
  if (!auth.currentUser) return {};
  const token = await getIdToken(auth.currentUser);
  return { Authorization: `Bearer ${token}` };
}
