import { signInAnonymously, type User } from "firebase/auth";
import { requireAuth } from "./firebase";

export async function ensureAnonymousAuth(): Promise<User> {
  const auth = requireAuth();
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}
