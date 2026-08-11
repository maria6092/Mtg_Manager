const ACHIEVEMENTS_DATA = [
  {
    "id": "collector_1",
    "cat": "Colección",
    "title": "Primer paso",
    "desc": "Registrar 1 carta",
    "diff": "easy"
  },
  {
    "id": "collector_10",
    "cat": "Colección",
    "title": "Aficionado",
    "desc": "Registrar 10 cartas",
    "diff": "easy"
  },
  {
    "id": "collector_25",
    "cat": "Colección",
    "title": "Pequeño archivo",
    "desc": "Registrar 25 cartas",
    "diff": "easy"
  },
  {
    "id": "collector_50",
    "cat": "Colección",
    "title": "Colección inicial",
    "desc": "Registrar 50 cartas",
    "diff": "easy"
  },
  {
    "id": "collector_100",
    "cat": "Colección",
    "title": "Mazo completo",
    "desc": "Registrar 100 cartas",
    "diff": "medium"
  },
  {
    "id": "collector_250",
    "cat": "Colección",
    "title": "Coleccionista",
    "desc": "Registrar 250 cartas",
    "diff": "medium"
  },
  {
    "id": "collector_500",
    "cat": "Colección",
    "title": "Archivo profesional",
    "desc": "Registrar 500 cartas",
    "diff": "medium"
  },
  {
    "id": "collector_1000",
    "cat": "Colección",
    "title": "Gran coleccionista",
    "desc": "Registrar 1.000 cartas",
    "diff": "hard"
  },
  {
    "id": "collector_2500",
    "cat": "Colección",
    "title": "Maestro de la colección",
    "desc": "Registrar 2.500 cartas",
    "diff": "hard"
  },
  {
    "id": "collector_5000",
    "cat": "Colección",
    "title": "Leyenda del cartón",
    "desc": "Registrar 5.000 cartas",
    "diff": "legendary"
  },
  {
    "id": "collector_10000",
    "cat": "Colección",
    "title": "The gathering",
    "desc": "Registrar 10.000 cartas",
    "diff": "legendary"
  },
  {
    "id": "unique_100",
    "cat": "Colección",
    "title": "Una de cada",
    "desc": "Tener 100 cartas diferentes",
    "diff": "easy"
  },
  {
    "id": "unique_500",
    "cat": "Colección",
    "title": "Catálogo extenso",
    "desc": "Tener 500 cartas diferentes",
    "diff": "medium"
  },
  {
    "id": "sets_5",
    "cat": "Colección",
    "title": "Expansionista",
    "desc": "Tener cartas de 5 sets diferentes",
    "diff": "easy"
  },
  {
    "id": "sets_10",
    "cat": "Colección",
    "title": "Experto en sets",
    "desc": "Tener cartas de 10 sets diferentes",
    "diff": "easy"
  },
  {
    "id": "sets_25",
    "cat": "Colección",
    "title": "Universo entero",
    "desc": "Tener cartas de 25 sets diferentes",
    "diff": "medium"
  },
  {
    "id": "sets_50",
    "cat": "Colección",
    "title": "Multiverso",
    "desc": "Tener cartas de 50 sets diferentes",
    "diff": "hard"
  },
  {
    "id": "all_colors",
    "cat": "Colección",
    "title": "Arcoíris",
    "desc": "Tener cartas de los 5 colores",
    "diff": "easy"
  },
  {
    "id": "color_10_each",
    "cat": "Colección",
    "title": "Paleta completa",
    "desc": "Tener 10 cartas de cada color",
    "diff": "medium"
  },
  {
    "id": "multicolor_25",
    "cat": "Colección",
    "title": "Multicolor",
    "desc": "Tener 25 cartas multicolores",
    "diff": "medium"
  },
  {
    "id": "rare_50",
    "cat": "Colección",
    "title": "Cazador de raras",
    "desc": "Tener 50 cartas raras",
    "diff": "medium"
  },
  {
    "id": "mythic_10",
    "cat": "Colección",
    "title": "Colección mítica",
    "desc": "Tener 10 cartas míticas",
    "diff": "medium"
  },
  {
    "id": "planeswalker_10",
    "cat": "Colección",
    "title": "Planeswalker",
    "desc": "Tener 10 Planeswalkers",
    "diff": "hard"
  },
  {
    "id": "favorites_25",
    "cat": "Colección",
    "title": "Favoritas",
    "desc": "Marcar 25 cartas como favoritas",
    "diff": "medium"
  },
  {
    "id": "favorite_first",
    "cat": "Colección",
    "title": "La niña de tus ojos",
    "desc": "Marcar una carta como favorita",
    "diff": "easy"
  },
  {
    "id": "value_250",
    "cat": "Colección",
    "title": "Patrimonio solido",
    "desc": "Alcanzar 250 € de valor de colección",
    "diff": "medium"
  },
  {
    "id": "value_1000",
    "cat": "Colección",
    "title": "Fortuna",
    "desc": "Alcanzar 1.000 € de valor de colección",
    "diff": "hard"
  },
  {
    "id": "value_5000",
    "cat": "Colección",
    "title": "Banquero del Cartón",
    "desc": "Alcanzar 5.000 € de valor de colección",
    "diff": "legendary"
  },
  {
    "id": "no_duplicates_100",
    "cat": "Colección",
    "title": "Sin duplicados",
    "desc": "Tener 100 cartas diferentes sin contar copias",
    "diff": "medium"
  },
  {
    "id": "deck_1",
    "cat": "Mazos",
    "title": "Primer mazo",
    "desc": "Crear tu primer mazo",
    "diff": "easy"
  },
  {
    "id": "deck_3",
    "cat": "Mazos",
    "title": "Trío de mazos",
    "desc": "Crear 3 mazos",
    "diff": "easy"
  },
  {
    "id": "deck_5",
    "cat": "Mazos",
    "title": "Constructor de mazos",
    "desc": "Crear 5 mazos",
    "diff": "easy"
  },
  {
    "id": "deck_10",
    "cat": "Mazos",
    "title": "Biblioteca de mazos",
    "desc": "Crear 10 mazos",
    "diff": "medium"
  },
  {
    "id": "deck_20",
    "cat": "Mazos",
    "title": "Arsenal",
    "desc": "Crear 20 mazos",
    "diff": "hard"
  },
  {
    "id": "deck_50",
    "cat": "Mazos",
    "title": "Arquitecto",
    "desc": "Crear 50 mazos",
    "diff": "legendary"
  },
  {
    "id": "deck_60",
    "cat": "Mazos",
    "title": "Preparado para la batalla",
    "desc": "Crear un mazo con 60+ cartas",
    "diff": "easy"
  },
  {
    "id": "deck_commander",
    "cat": "Mazos",
    "title": "Comandante",
    "desc": "Crear un mazo Commander",
    "diff": "medium"
  },
  {
    "id": "deck_monocolor",
    "cat": "Mazos",
    "title": "Mono-color",
    "desc": "Crear un mazo monocolor",
    "diff": "easy"
  },
  {
    "id": "deck_5colors",
    "cat": "Mazos",
    "title": "Cinco colores",
    "desc": "Crear un mazo de cinco colores",
    "diff": "medium"
  },
  {
    "id": "deck_4colors",
    "cat": "Mazos",
    "title": "Exclusión",
    "desc": "Crear un mazo de cuatro colores",
    "diff": "medium"
  },
  {
    "id": "deck_10_unique_colors",
    "cat": "Mazos",
    "title": "Maestro del color",
    "desc": "Crear 10 mazos con identidades de color diferentes",
    "diff": "hard"
  },
  {
    "id": "deck_wishlist",
    "cat": "Mazos",
    "title": "Planificador",
    "desc": "Enviar cartas faltantes de un mazo a deseos",
    "diff": "easy"
  },
  {
    "id": "deck_100",
    "cat": "Mazos",
    "title": "Centenario",
    "desc": "Crear un mazo con 100 cartas",
    "diff": "medium"
  },
  {
    "id": "deck_25",
    "cat": "Mazos",
    "title": "Gran biblioteca",
    "desc": "Tener 25 mazos guardados",
    "diff": "hard"
  },
  {
    "id": "deck_50cards",
    "cat": "Mazos",
    "title": "Muro de cartas",
    "desc": "Crear un mazo con 50 cartas o más",
    "diff": "easy"
  },
  {
    "id": "deck_rebuild",
    "cat": "Mazos",
    "title": "Reconstructor",
    "desc": "Modificar un mazo existente 10 veces",
    "diff": "medium"
  },
  {
    "id": "deck_organized",
    "cat": "Mazos",
    "title": "Organizado",
    "desc": "Mantener 10 mazos guardados",
    "diff": "easy"
  },
  {
    "id": "wish_1",
    "cat": "Wishlist",
    "title": "Deseo pendiente",
    "desc": "Añadir una carta a deseos",
    "diff": "easy"
  },
  {
    "id": "wish_5",
    "cat": "Wishlist",
    "title": "Soñador",
    "desc": "Tener 5 cartas en deseos",
    "diff": "easy"
  },
  {
    "id": "wish_10",
    "cat": "Wishlist",
    "title": "Cazador de cartas",
    "desc": "Tener 10 cartas en deseos",
    "diff": "easy"
  },
  {
    "id": "wish_25",
    "cat": "Wishlist",
    "title": "Lista de objetivos",
    "desc": "Tener 25 cartas en deseos",
    "diff": "medium"
  },
  {
    "id": "wish_50",
    "cat": "Wishlist",
    "title": "Cazador incansable",
    "desc": "Tener 50 cartas en deseos",
    "diff": "medium"
  },
  {
    "id": "wish_100",
    "cat": "Wishlist",
    "title": "Todo lo quiero",
    "desc": "Tener 100 cartas en deseos",
    "diff": "hard"
  },
  {
    "id": "wish_complete_1",
    "cat": "Wishlist",
    "title": "Deseo cumplido",
    "desc": "Conseguir una carta de la wishlist",
    "diff": "easy"
  },
  {
    "id": "wish_complete_10",
    "cat": "Wishlist",
    "title": "Colección soñada",
    "desc": "Conseguir 10 cartas de la wishlist",
    "diff": "medium"
  },
  {
    "id": "wish_complete_25",
    "cat": "Wishlist",
    "title": "Cazador de tesoros",
    "desc": "Conseguir 25 cartas de la wishlist",
    "diff": "hard"
  },
  {
    "id": "wish_empty",
    "cat": "Wishlist",
    "title": "Sin deseos pendientes",
    "desc": "Vaciar completamente la wishlist",
    "diff": "easy"
  },
  {
    "id": "wish_30days",
    "cat": "Wishlist",
    "title": "Paciente",
    "desc": "Mantener una carta en deseos durante 30 días",
    "diff": "medium"
  },
  {
    "id": "wish_90days",
    "cat": "Wishlist",
    "title": "Incansable",
    "desc": "Mantener una carta en deseos durante 90 días",
    "diff": "hard"
  },
  {
    "id": "wish_price_drop",
    "cat": "Wishlist",
    "title": "Invensor",
    "desc": "Conseguir una bajada de precio de una carta deseada",
    "diff": "medium"
  },
  {
    "id": "wish_deck",
    "cat": "Wishlist",
    "title": "Plan de batalla",
    "desc": "Añadir a deseos una carta que falta para un mazo",
    "diff": "easy"
  },
  {
    "id": "wish_50complete",
    "cat": "Wishlist",
    "title": "Sueño completo",
    "desc": "Conseguir 50 cartas de la wishlist",
    "diff": "legendary"
  },
  {
    "id": "seller_1",
    "cat": "Mercado",
    "title": "Primer vendedor",
    "desc": "Poner una carta en venta",
    "diff": "easy"
  },
  {
    "id": "seller_5",
    "cat": "Mercado",
    "title": "Primer escaparate",
    "desc": "Poner 5 cartas en venta",
    "diff": "easy"
  },
  {
    "id": "seller_10",
    "cat": "Mercado",
    "title": "Pequeño comerciante",
    "desc": "Poner 10 cartas en venta",
    "diff": "easy"
  },
  {
    "id": "seller_25",
    "cat": "Mercado",
    "title": "Vendedor activo",
    "desc": "Poner 25 cartas en venta",
    "diff": "medium"
  },
  {
    "id": "seller_50",
    "cat": "Mercado",
    "title": "Vendedor habitual",
    "desc": "Poner 50 cartas en venta",
    "diff": "medium"
  },
  {
    "id": "seller_100",
    "cat": "Mercado",
    "title": "Tienda propia",
    "desc": "Poner 100 cartas en venta",
    "diff": "hard"
  },
  {
    "id": "friend_1",
    "cat": "Comunidad",
    "title": "Sociable",
    "desc": "Añadir tu primer amigo",
    "diff": "easy"
  },
  {
    "id": "friends_5",
    "cat": "Comunidad",
    "title": "Grupo de amigos",
    "desc": "Tener 5 amigos",
    "diff": "easy"
  },
  {
    "id": "friends_10",
    "cat": "Comunidad",
    "title": "Comunidad",
    "desc": "Tener 10 amigos",
    "diff": "medium"
  },
  {
    "id": "friends_25",
    "cat": "Comunidad",
    "title": "Conocido por todos",
    "desc": "Tener 25 amigos",
    "diff": "hard"
  },
  {
    "id": "friends_50",
    "cat": "Comunidad",
    "title": "Pilar de la comunidad",
    "desc": "Tener 50 amigos",
    "diff": "legendary"
  },
  {
    "id": "request_1",
    "cat": "Comunidad",
    "title": "Primer contacto",
    "desc": "Enviar una solicitud de amistad",
    "diff": "easy"
  },
  {
    "id": "accept_1",
    "cat": "Comunidad",
    "title": "Buen amigo",
    "desc": "Aceptar una solicitud de amistad",
    "diff": "easy"
  },
  {
    "id": "received_10",
    "cat": "Comunidad",
    "title": "Popular",
    "desc": "Recibir 10 solicitudes de amistad",
    "diff": "medium"
  },
  {
    "id": "received_25",
    "cat": "Comunidad",
    "title": "Persona conocida",
    "desc": "Recibir 25 solicitudes de amistad",
    "diff": "hard"
  },
  {
    "id": "message_1",
    "cat": "Comunidad",
    "title": "Conversador",
    "desc": "Enviar tu primer mensaje",
    "diff": "easy"
  },
  {
    "id": "message_100",
    "cat": "Comunidad",
    "title": "Hablador",
    "desc": "Enviar 100 mensajes",
    "diff": "easy"
  },
  {
    "id": "message_500",
    "cat": "Comunidad",
    "title": "Charlatán",
    "desc": "Enviar 500 mensajes",
    "diff": "medium"
  },
  {
    "id": "public_collection",
    "cat": "Comunidad",
    "title": "Puertas abiertas",
    "desc": "Hacer pública tu colección",
    "diff": "easy"
  },
  {
    "id": "private_collection",
    "cat": "Comunidad",
    "title": "Cofre privado",
    "desc": "Hacer privada tu colección",
    "diff": "medium"
  },
  {
    "id": "search_1",
    "cat": "Especiales",
    "title": "Curioso",
    "desc": "Buscar tu primera carta",
    "diff": "easy"
  },
  {
    "id": "search_25",
    "cat": "Especiales",
    "title": "Investigador",
    "desc": "Buscar 25 cartas",
    "diff": "easy"
  },
  {
    "id": "search_100",
    "cat": "Especiales",
    "title": "Experto",
    "desc": "Buscar 100 cartas",
    "diff": "medium"
  },
  {
    "id": "search_500",
    "cat": "Especiales",
    "title": "Enciclopedia",
    "desc": "Buscar 500 cartas",
    "diff": "hard"
  },
  {
    "id": "first_backup",
    "cat": "Especiales",
    "title": "Primer respaldo",
    "desc": "Crear el primer backup",
    "diff": "easy"
  },
  {
    "id": "backup_5",
    "cat": "Especiales",
    "title": "Colección protegida",
    "desc": "Crear 5 backups",
    "diff": "medium"
  },
  {
    "id": "restore_backup",
    "cat": "Especiales",
    "title": "Restaurador",
    "desc": "Restaurar correctamente un backup",
    "diff": "medium"
  },
  {
    "id": "auto_backup",
    "cat": "Especiales",
    "title": "Siempre preparado",
    "desc": "Activar backups automáticos",
    "diff": "easy"
  },
  {
    "id": "profile_edit",
    "cat": "Especiales",
    "title": "Mi perfil",
    "desc": "Personalizar tu perfil por primera vez",
    "diff": "easy"
  },
  {
    "id": "profile_complete",
    "cat": "Especiales",
    "title": "Perfil completo",
    "desc": "Completar todos los campos del perfil",
    "diff": "medium"
  },
  {
    "id": "first_login",
    "cat": "Especiales",
    "title": "Bienvenido",
    "desc": "Iniciar sesión por primera vez",
    "diff": "easy"
  },
  {
    "id": "days_7",
    "cat": "Especiales",
    "title": "Constante",
    "desc": "Usar la aplicación durante 7 días diferentes",
    "diff": "medium"
  },
  {
    "id": "days_30",
    "cat": "Especiales",
    "title": "Veterano",
    "desc": "Usar la aplicación durante 30 días diferentes",
    "diff": "hard"
  },
  {
    "id": "days_100",
    "cat": "Especiales",
    "title": "Habitual",
    "desc": "Usar la aplicación durante 100 días diferentes",
    "diff": "legendary"
  },
  {
    "id": "all_sections",
    "cat": "Especiales",
    "title": "Explorador total",
    "desc": "Visitar todas las secciones principales",
    "diff": "easy"
  },
  {
    "id": "perfect_collection",
    "cat": "Especiales",
    "title": "Perfeccionista",
    "desc": "Desbloquear todos los logros",
    "diff": "legendary"
  },
  {
    "id": "achievement_25",
    "cat": "Especiales",
    "title": "Leyenda de logros",
    "desc": "Conseguir 25 logros",
    "diff": "hard"
  },
  {
    "id": "achievement_50",
    "cat": "Especiales",
    "title": "Maestro de logros",
    "desc": "Conseguir 50 logros",
    "diff": "hard"
  },
  {
    "id": "achievement_75",
    "cat": "Especiales",
    "title": "Cazador de logros",
    "desc": "Conseguir 75 logros",
    "diff": "legendary"
  },
  {
    "id": "achievement_100",
    "cat": "Especiales",
    "title": "Completista",
    "desc": "Conseguir 100 logros",
    "diff": "legendary"
  },
  {
    "id": "secret_achievement",
    "cat": "Especiales",
    "title": "¿Qué había aquí?",
    "desc": "Desbloquear un logro secreto",
    "diff": "medium"
  },
  {
    "id": "night_owl",
    "cat": "Especiales",
    "title": "Coleccionista nocturno",
    "desc": "Usar la aplicación durante la noche",
    "diff": "medium"
  },
  {
    "id": "full_profile",
    "cat": "Especiales",
    "title": "Presencia completa",
    "desc": "Tener perfil, colección, mazo y wishlist configurados",
    "diff": "medium"
  }
];

window.ACHIEVEMENTS_DATA = ACHIEVEMENTS_DATA;
