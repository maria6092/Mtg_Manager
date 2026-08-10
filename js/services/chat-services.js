function chatIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

export async function getOrCreateChat(otherUid, otherName, context = null) {
  const me = window._fbCurrentUser;
  if (!me) throw new Error('No autenticado');
  const { doc, getDoc, setDoc } = window._fbFns;
  const db = window._fbDb;
  const chatId = chatIdFor(me.uid, otherUid);
  const ref = doc(db, 'chats', chatId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [me.uid, otherUid].sort(),
      participantNames: {
        [me.uid]: me.displayName || me.email || 'Usuario',
        [otherUid]: otherName || 'Usuario',
      },
      lastMessage: '',
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
      context: context || null,
    });
  }
  return chatId;
}

export async function sendMessage(chatId, text) {
  const me = window._fbCurrentUser;
  if (!me || !text.trim()) return;
  const { doc, collection, addDoc, updateDoc, serverTimestamp } = window._fbFns;
  const db = window._fbDb;
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    from: me.uid,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: text.trim().slice(0, 120),
    lastMessageAt: Date.now(),
  });
}

export function listenMessages(chatId, cb) {
  const { collection, query, orderBy, onSnapshot } = window._fbFns;
  const db = window._fbDb;
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export function listenMyChats(cb) {
  const me = window._fbCurrentUser;
  if (!me) return () => {};
  const { collection, query, where, orderBy, onSnapshot } = window._fbFns;
  const db = window._fbDb;
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', me.uid),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}