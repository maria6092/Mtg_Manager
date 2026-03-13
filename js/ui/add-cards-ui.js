const SCRYFALL_API = "https://api.scryfall.com/cards/search?q="

function initAddCardsPage() {

  const searchBtn = document.getElementById("card-search-btn")
  const searchInput = document.getElementById("card-search-input")

  searchBtn.addEventListener("click", () => {
    searchCards(searchInput.value)
  })

}

async function searchCards(query) {

  if (!query) return

  const url = SCRYFALL_API + encodeURIComponent(query)

  const res = await fetch(url)
  const data = await res.json()

  renderSearchResults(data.data)

}

function renderSearchResults(cards) {

  const container = document.getElementById("search-results")
  container.innerHTML = ""

  cards.forEach(card => {

    const image =
      card.image_uris?.small ||
      card.card_faces?.[0]?.image_uris?.small ||
      ""

    const div = document.createElement("div")
    div.className = "card"

    div.innerHTML = `
      <img src="${image}">
      <h4>${card.name}</h4>
      <button data-id="${card.id}">
        Añadir
      </button>
    `

    const btn = div.querySelector("button")

    btn.addEventListener("click", () => {
      addCardToCollection(card)
    })

    container.appendChild(div)

  })

}

function addCardToCollection(card) {

  const collection =
    JSON.parse(localStorage.getItem("mtg_collection")) || []

  const existing = collection.find(c => c.id === card.id)

  if (existing) {

    existing.quantity += 1

  } else {

    collection.push({
      id: card.id,
      name: card.name,
      image:
        card.image_uris?.normal ||
        card.card_faces?.[0]?.image_uris?.normal ||
        "",
      set: card.set,
      quantity: 1
    })

  }

  localStorage.setItem(
    "mtg_collection",
    JSON.stringify(collection)
  )

  alert("Carta añadida a la colección")

}