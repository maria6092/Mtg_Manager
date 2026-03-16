/**
 * profile.js
 * Lógica del perfil de usuario: carga, guardado y sincronización con Firestore.
 */

import { getProfile, setProfile, getFbUser, getCurrentUserId } from "../../state/store.js";
import { userLoad, userSave, LS_PROFILE } from "../../utils/storage.js";
import { fbDb, fbStorage } from "../../services/firebase.js";

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_PROFILE = {
  displayName: "",
  bio:         "",
  avatar:      "assets/logo.png",
  banner:      "",
};

// ─── Carga ────────────────────────────────────────────────────────────────────

export function loadProfile() {
  const raw = userLoad(LS_PROFILE, null, []);
  const profile = raw ? { ...DEFAULT_PROFILE, ...raw } : { ...DEFAULT_PROFILE };
  setProfile(profile);
  return profile;
}

// ─── Guardado local ───────────────────────────────────────────────────────────

export function saveProfile() {
  userSave(LS_PROFILE, getProfile());
}

// ─── Helpers de lectura ───────────────────────────────────────────────────────

export function getProfileName() {
  const p = getProfile();
  const u = getFbUser();
  return p.displayName?.trim() || u?.displayName || "Usuario";
}

export function getProfileEmail() {
  return getFbUser()?.email || "";
}

export function getProfileAvatar() {
  return getProfile().avatar || "assets/logo.png";
}

// ─── Sincronización con Firestore ─────────────────────────────────────────────

/** Guarda el perfil público del usuario en Firestore */
export async function fsSaveProfile() {
  const uid = getCurrentUserId();
  if (!uid) return;
  const u = getFbUser();
  const p = getProfile();
  try {
    await fbDb.collection("users").doc(uid).set({
      uid,
      username:    u?.displayName || "",
      email:       u?.email || "",
      displayName: p.displayName || u?.displayName || "",
      bio:         p.bio || "",
      avatar:      p.avatar || "",
      updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn("[profile] fsSaveProfile:", e);
  }
}

/** Carga datos sociales del usuario desde Firestore */
export async function fsLoadSocialData() {
  const uid = getCurrentUserId();
  if (!uid) return;
  try {
    // Solicitudes de amistad recibidas o enviadas
    const [receivedSnap, sentSnap, friendshipsSnap] = await Promise.all([
      fbDb.collection("friend_requests").where("to",   "==", uid).get(),
      fbDb.collection("friend_requests").where("from", "==", uid).get(),
      fbDb.collection("friendships")
        .where("users", "array-contains", uid).get(),
    ]);

    const requests = [];
    receivedSnap.forEach(d => requests.push({ id: d.id, ...d.data() }));
    sentSnap.forEach(d => {
      if (!requests.some(r => r.id === d.id)) requests.push({ id: d.id, ...d.data() });
    });

    const friendships = [];
    friendshipsSnap.forEach(d => {
      const data = d.data();
      const other = (data.users || []).find(u => u !== uid);
      if (other) friendships.push({ id: d.id, a: uid, b: other, createdAt: data.createdAt?.toMillis?.() || 0 });
    });

    return { requests, friendships };
  } catch (e) {
    console.warn("[profile] fsLoadSocialData:", e);
    return { requests: [], friendships: [] };
  }
}

// ─── Upload de imágenes ───────────────────────────────────────────────────────

async function uploadImage(file, storagePath) {
  const ref  = fbStorage.ref(storagePath);
  const snap = await ref.put(file);
  return await snap.ref.getDownloadURL();
}

export async function uploadAvatar(file) {
  const uid = getCurrentUserId();
  if (!uid || !file) return null;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const url = await uploadImage(file, `avatars/${uid}.${ext}`);
  const profile = getProfile();
  profile.avatar = url;
  saveProfile();
  await getFbUser()?.updateProfile({ photoURL: url });
  return url;
}

export async function uploadBanner(file) {
  const uid = getCurrentUserId();
  if (!uid || !file) return null;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const url = await uploadImage(file, `banners/${uid}.${ext}`);
  const profile = getProfile();
  profile.banner = url;
  saveProfile();
  return url;
}

// ─── Búsqueda de usuarios ─────────────────────────────────────────────────────

/** Busca un usuario en Firestore por username o email */
export async function fsSearchUser(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;

  let snap = await fbDb.collection("users").where("username", "==", q).limit(1).get();
  if (!snap.empty) return snap.docs[0].data();

  snap = await fbDb.collection("users").where("email", "==", q).limit(1).get();
  if (!snap.empty) return snap.docs[0].data();

  return null;
}
