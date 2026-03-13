function initCollectionPage() {

  renderCollection()

  const filter = document.getElementById("collection-filter")

  filter.addEventListener("input", () => {
    renderCollection(filter.value)
  })

}

function renderCollection(filter = "") {

  const container = document.getElementById("collection-grid")

  const collection =
    JSON.parse(localStorage.getItem("mtg_collection")) || []

  container.innerHTML = ""

  collection
    .filter(card =>
      card.name.toLowerCase().includes(filter.toLowerCase())
    )
    .forEach(card => {

      const div = document.createElement("div")
      div.className = "card"

      div.innerHTML = `
        <img src="${card.image}">
        <h4>${card.name}</h4>
        <p>Cantidad: ${card.quantity}</p>

        <button data-id="${card.id}">
          Borrar
        </button>
      `

      const btn = div.querySelector("button")

      btn.addEventListener("click", () => {
        deleteCard(card.id)
      })

      container.appendChild(div)

    })

}

function deleteCard(id) {

  let collection =
    JSON.parse(localStorage.getItem("mtg_collection")) || []

  collection = collection.filter(card => card.id !== id)

  localStorage.setItem(
    "mtg_collection",
    JSON.stringify(collection)
  )

  renderCollection()

}