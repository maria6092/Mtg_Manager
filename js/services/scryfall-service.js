export async function searchScryfallCards(cardName, setCode = '', lang = '') {
  if (!cardName?.trim()) {
    throw new Error('Escribe el nombre de una carta');
  }

  let query = `!"${cardName.trim()}"`;
  if (setCode?.trim()) query += ` set:${setCode.trim()}`;
  if (lang?.trim()) query += ` lang:${lang.trim()}`;

  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.data || data.data.length === 0) return [];
  return data.data.slice(0, 10);
}
