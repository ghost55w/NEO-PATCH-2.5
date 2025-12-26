
// ---------------- UTILITAIRE NOM ----------------
function formatNameFromKey(key) {
  return key
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ================================
// FALLEN ANGELES PNJ 🌴
// ================================
const fallenAngels = {
  "Dexter Mikey": {
    sexe: "Homme",
    classe: "Resident",
    social: "Neolitain",
    home: "Fallen Angeles",
    lifestyle: "200",
    charisme: 20,
    likes: ["Pouvoir", "Musique", "Manipulation"],
    dislikes: ["Obéissance", "Faiblesse"],
    friends: ["mazikeen"],
    lovers: ["lilith"],
    image: "https://example.com/lucifer.png",
    image_home: "https://example.com/lucifer_home.png",
    image_extra: "",
    habits: ["Piano", "Vin ancien"]
  },

  "azrael": {
    sexe: "Femme",
    classe: "Ange de la Mort",
    social: "Solitaire",
    home: "Cathédrale abandonnée",
    lifestyle: "Austère",
    charisme: 85,
    likes: ["Silence", "Équilibre"],
    dislikes: ["Chaos"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Méditation"]
  },

  "lilith": {
    sexe: "Femme",
    classe: "Démone Originelle",
    social: "Élite",
    home: "Palais nocturne",
    lifestyle: "Luxueux",
    charisme: 96,
    likes: ["Séduction", "Pouvoir"],
    dislikes: ["Soumission"],
    friends: ["lucifer morningstar"],
    lovers: ["lucifer morningstar"],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Manipulation"]
  },

  "belial": {
    sexe: "Homme",
    classe: "Prince Démon",
    social: "Noble",
    home: "Citadelle rouge",
    lifestyle: "Opulent",
    charisme: 92,
    likes: ["Guerre", "Stratégie"],
    dislikes: ["Paix"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Planification"]
  },

  "asmodeus": {
    sexe: "Homme",
    classe: "Démon de la Luxure",
    social: "Noble",
    home: "Palais du désir",
    lifestyle: "Excessif",
    charisme: 90,
    likes: ["Plaisir", "Tentations"],
    dislikes: ["Pureté"],
    friends: [],
    lovers: ["lilith"],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Fêtes"]
  },

  "mammon": {
    sexe: "Homme",
    classe: "Démon de l'Avarice",
    social: "Élite",
    home: "Banque infernale",
    lifestyle: "Luxueux",
    charisme: 88,
    likes: ["Argent", "Contrats"],
    dislikes: ["Pauvreté"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Comptabilité"]
  },

  "leviathan": {
    sexe: "Homme",
    classe: "Bête Abyssale",
    social: "Marginal",
    home: "Océan infernal",
    lifestyle: "Sauvage",
    charisme: 80,
    likes: ["Chaos"],
    dislikes: ["Ordre"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Destruction"]
  },

  "beelzebub": {
    sexe: "Homme",
    classe: "Seigneur des Mouches",
    social: "Noble",
    home: "Tour putride",
    lifestyle: "Décadent",
    charisme: 89,
    likes: ["Corruption"],
    dislikes: ["Pureté"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Propagation"]
  },

  "abaddon": {
    sexe: "Homme",
    classe: "Ange de l’Apocalypse",
    social: "Solitaire",
    home: "Ruines célestes",
    lifestyle: "Militaire",
    charisme: 91,
    likes: ["Destruction"],
    dislikes: ["Espoir"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Veille"]
  },

  "samael": {
    sexe: "Homme",
    classe: "Archange Corrompu",
    social: "Noble",
    home: "Forteresse noire",
    lifestyle: "Strict",
    charisme: 93,
    likes: ["Justice brute"],
    dislikes: ["Clémence"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Jugement"]
  },

  "raziel": {
    sexe: "Homme",
    classe: "Gardien des Secrets",
    social: "Solitaire",
    home: "Bibliothèque interdite",
    lifestyle: "Mystique",
    charisme: 87,
    likes: ["Connaissance"],
    dislikes: ["Ignorance"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Lecture"]
  },

  "melkor": {
    sexe: "Homme",
    classe: "Seigneur Déchu",
    social: "Marginal",
    home: "Trône brisé",
    lifestyle: "Ancien",
    charisme: 95,
    likes: ["Domination"],
    dislikes: ["Création"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Complot"]
  },

  "eris": {
    sexe: "Femme",
    classe: "Déesse du Chaos",
    social: "Marginal",
    home: "Nulle part",
    lifestyle: "Imprévisible",
    charisme: 90,
    likes: ["Discorde"],
    dislikes: ["Stabilité"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Provocation"]
  },

  "nyx": {
    sexe: "Femme",
    classe: "Déesse Nocturne",
    social: "Noble",
    home: "Royaume des Ombres",
    lifestyle: "Calme",
    charisme: 94,
    likes: ["Nuit"],
    dislikes: ["Lumière"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Observation"]
  },

  "thanatos": {
    sexe: "Homme",
    classe: "Incarnation de la Mort",
    social: "Solitaire",
    home: "Entre-monde",
    lifestyle: "Silencieux",
    charisme: 88,
    likes: ["Repos"],
    dislikes: ["Immortalité"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Veille"]
  },

  "morrigan": {
    sexe: "Femme",
    classe: "Déesse de la Guerre",
    social: "Noble",
    home: "Champ de bataille",
    lifestyle: "Martial",
    charisme: 91,
    likes: ["Combat"],
    dislikes: ["Lâcheté"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Entraînement"]
  },

  "hela": {
    sexe: "Femme",
    classe: "Reine des Morts",
    social: "Élite",
    home: "Helheim",
    lifestyle: "Sombre",
    charisme: 97,
    likes: ["Âmes"],
    dislikes: ["Vie"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Collecte"]
  },

  "anubis": {
    sexe: "Homme",
    classe: "Juge des Âmes",
    social: "Noble",
    home: "Salle du Jugement",
    lifestyle: "Rituel",
    charisme: 86,
    likes: ["Équilibre"],
    dislikes: ["Désordre"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Pesée"]
  },

  "baphomet": {
    sexe: "Ambidextre",
    classe: "Entité Occulte",
    social: "Marginal",
    home: "Sanctuaire interdit",
    lifestyle: "Ésotérique",
    charisme: 89,
    likes: ["Rituels"],
    dislikes: ["Dogmes"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Invocation"]
  },

  "ereshkigal": {
    sexe: "Femme",
    classe: "Reine des Enfers",
    social: "Élite",
    home: "Trône souterrain",
    lifestyle: "Autoritaire",
    charisme: 96,
    likes: ["Contrôle"],
    dislikes: ["Rébellion"],
    friends: [],
    lovers: [],
    image: "",
    image_home: "",
    image_extra: "",
    habits: ["Gouvernance"]
  }
};

// ================================
// 🔵 CATÉGORIE SELON CHARISME
// ================================
function determineCategory(charisme) {
  if (charisme >= 95) return "mythique";
  if (charisme >= 85) return "légendaire";
  if (charisme >= 70) return "rare";
  return "commun";
}

// ================================
// 🔵 PLACEMENT SOCIAL
// ================================
function determinePlacement(social) {
  if (social === "Élite") return "dominant";
  if (social === "Noble") return "influent";
  if (social === "Solitaire") return "neutre";
  return "marginal";
}

// ================================
// 🔵 CRÉATION D’UNE FICHE PNJ
// ================================
function createFallenAngelFromBase(key, data) {
  return {
    id: key,
    name: formatNameFromKey(key),
    sexe: data.sexe,
    classe: data.classe,
    social: data.social,
    home: data.home,
    lifestyle: data.lifestyle,
    charisme: data.charisme,
    likes: data.likes,
    dislikes: data.dislikes,
    friends: data.friends,
    lovers: data.lovers,
    image: data.image,
    image_home: data.image_home,
    image_extra: data.image_extra,
    habits: data.habits,
    category: determineCategory(data.charisme),
    placement: determinePlacement(data.social)
  };
}

// ================================
// 🔵 GROUPER PAR PLACEMENT
// ================================
function groupFallenAngelsByPlacement(array) {
  const grouped = {};
  for (const angel of array) {
    if (!grouped[angel.placement]) grouped[angel.placement] = [];
    grouped[angel.placement].push(angel);
  }
  return grouped;
}

// ================================
// 🔵 GÉNÉRATION GLOBALE
// ================================
function generateFallenAngelsFromBase(object) {
  const all = [];
  for (const [key, value] of Object.entries(object)) {
    all.push(createFallenAngelFromBase(key, value));
  }
  return groupFallenAngelsByPlacement(all);
}

// ================================
// 🔵 EXPORT
// ================================
const groupedFallenAngels = generateFallenAngelsFromBase(fallenAngels);

module.exports = {
  fallenAngels,
  groupedFallenAngels,
  generateFallenAngelsFromBase
};
