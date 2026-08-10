import { getOrCreateChat, sendMessage, listenMessages, listenMyChats } from '../services/chat-service.js';
import { escapeHtml, qsa } from '../core/utils.js';

let unsubMessages = null;
let unsubChats = null;
let activeChatId = null;
let myChatsCache = [];

export function renderMensajes() {
  if (unsubChats) unsubChats();
  unsubChats = listenMyChats(chats => {
    myChatsCache = chats;
    renderChatList(chats);
  });
}

function renderChatList(chats) {
  const box = document.getElementById('chatList');
  if (!box) return;
  const me = window._fbCurrentUser?.uid;
  if (!chats.length) {
    box.innerHTML = '<div class="hint" style="padding:16px;">Aún no tienes conversaciones.</div>';
    return;
  }
  box.innerHTML = chats.map(c => {
    const otherUid = c.participants.find(p => p !== me);
    const otherName = c.participantNames?.[otherUid] || 'Usuario';
    const active = c.id === activeChatId ? 'selected-deck-row' : '';
    return `<div class="deckListRow ${active}" data-chat-id="${c.id}">
      <div class="deckListRowMain">
        <div class="deckListName">${escapeHtml(otherName)}</div>
        <div class="deckListRowMeta">${escapeHtml(c.lastMessage || 'Sin mensajes')}</div>
      </div>
    </div>`;
  }).join('');
  qsa('[data-chat-id]', box).forEach(row => {
    row.addEventListener('click', () => openChat(row.dataset.chatId));
  });
}

// Llamar desde "Tienda"/listings: openChatWithUser(vendedorUid, vendedorNombre, {listingId, cardName})
export async function openChatWithUser(otherUid, otherName, context) {
  const chatId = await getOrCreateChat(otherUid, otherName, context);
  openChat(chatId);
}

function openChat(chatId) {
  activeChatId = chatId;
  renderChatList(myChatsCache);
  const chat = myChatsCache.find(c => c.id === chatId);
  const me = window._fbCurrentUser?.uid;
  const otherUid = chat?.participants?.find(p => p !== me);
  const otherName = chat?.participantNames?.[otherUid] || 'Usuario';
  const titleEl = document.getElementById('chatThreadTitle');
  if (titleEl) titleEl.textContent = otherName;
  if (unsubMessages) unsubMessages();
  unsubMessages = listenMessages(chatId, renderThread);
  const form = document.getElementById('chatInputRow');
  if (form) form.style.display = 'flex';
}

function renderThread(messages) {
  const box = document.getElementById('chatThread');
  if (!box) return;
  const me = window._fbCurrentUser?.uid;
  box.innerHTML = messages.map(m => `
    <div class="chatBubbleRow ${m.from === me ? 'mine' : ''}">
      <div class="chatBubble ${m.from === me ? 'mine' : ''}">${escapeHtml(m.text)}</div>
    </div>`).join('');
  box.scrollTop = box.scrollHeight;
}

export function initChatUI() {
  const form = document.getElementById('chatInputRow');
  const input = document.getElementById('chatInput');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!activeChatId || !input.value.trim()) return;
    await sendMessage(activeChatId, input.value);
    input.value = '';
  });
}