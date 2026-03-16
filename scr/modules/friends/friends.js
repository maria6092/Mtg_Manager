/**
 * friends.js
 * Lógica del sistema de amigos: solicitudes, aceptar, rechazar, eliminar.
 */

import { getCurrentUserId } from "../../state/store.js";
import { fbDb } from "../../services/firebase.js";
import { socialPairKey } from "../../utils/helpers.js";
import { loadSocial, saveSocial } from "../../utils/storage.js";
import { fsSearchUser } from "../profile/profile.js";

// ─── Lectura del estado social local ─────────────────────────────────────────

export function getPublicProfileByUserId(userId) {
  // Sin acceso al directorio de usuarios en cliente, usamos el caché local
  const { loadJson, scopedKey, LS_PROFILE } = await import("../../utils/storage.js");
  const p = loadJson(scopedKey(LS_PROFILE, userId), {});
  return {
    id:          userId,
    username:    p?.displayName?.trim() || "Usuario",
    email:       "",
    displayName: p?.displayName?.trim() || "Usuario",
    bio:         p?.bio?.trim() || "",
    avatar:      p?.avatar || "assets/logo.png",
  };
}

export function getFriendsData() {
  const uid    = getCurrentUserId();
  const social = loadSocial();

  const friends = social.friendships
    .filter(f => f.a === uid || f.b === uid)
    .map(f => {
      const otherId = f.a === uid ? f.b : f.a;
      // Perfil básico desde caché local
      return {
        id:           otherId,
        username:     "Usuario",
        displayName:  "Usuario",
        avatar:       "assets/logo.png",
        createdAt:    f.createdAt || 0,
        friendshipId: f.id || socialPairKey(uid, otherId),
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" }));

  const received = social.requests
    .filter(r => r.to === uid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const sent = social.requests
    .filter(r => r.from === uid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return { social, friends, received, sent };
}

// ─── Acciones de amistad ──────────────────────────────────────────────────────

/**
 * Envía una solicitud de amistad.
 * @param {string} query - username o email del destinatario
 */
export async function sendFriendRequest(query) {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("Debes iniciar sesión.");

  const q = String(query || "").trim().toLowerCase();
  if (!q) throw new Error("Escribe un nombre de usuario o email.");

  const target = await fsSearchUser(q);
  if (!target) throw new Error("No se encontró ningún usuario con ese nombre o email.");
  if (target.uid === uid) throw new Error("No puedes enviarte una solicitud a ti mismo.");

  const social = loadSocial();

  const alreadyFriends = social.friendships.some(
    f => socialPairKey(f.a, f.b) === socialPairKey(uid, target.uid)
  );
  if (alreadyFriends) throw new Error("Ya sois amigos.");

  const existing = social.requests.find(r =>
    (r.from === uid && r.to === target.uid) ||
    (r.from === target.uid && r.to === uid)
  );

  if (existing) {
    // Si el otro ya nos envió solicitud, la aceptamos directamente
    if (existing.from === target.uid && existing.to === uid) {
      await acceptFriendRequest(existing.id);
      return { autoAccepted: true, target };
    }
    throw new Error("Ya hay una solicitud pendiente.");
  }

  await fsSendFriendRequest(target.uid);
  return { autoAccepted: false, target };
}

/**
 * Acepta una solicitud de amistad.
 */
export async function acceptFriendRequest(reqId) {
  const uid  = getCurrentUserId();
  const ref  = fbDb.collection("friend_requests").doc(reqId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const { from, to } = snap.data();
  const batch = fbDb.batch();
  batch.update(ref, { status: "accepted" });

  const fid = [from, to].sort().join("__");
  batch.set(fbDb.collection("friendships").doc(fid), {
    users:     [from, to],
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Rechaza o cancela una solicitud.
 */
export async function declineFriendRequest(reqId) {
  await fbDb.collection("friend_requests").doc(reqId).delete();
}

/**
 * Elimina una amistad existente.
 */
export async function removeFriend(friendUid) {
  const uid = getCurrentUserId();
  const fid = [uid, friendUid].sort().join("__");
  await fbDb.collection("friendships").doc(fid).delete();
}

// ─── Firestore — enviar solicitud ─────────────────────────────────────────────

async function fsSendFriendRequest(toUid) {
  const uid   = getCurrentUserId();
  const reqId = [uid, toUid].sort().join("__");
  await fbDb.collection("friend_requests").doc(reqId).set({
    from:      uid,
    to:        toUid,
    status:    "pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}
