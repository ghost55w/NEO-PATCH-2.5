// ---------------- UTILITAIRE NOM ----------------
function formatNameFromKey(key) {
  return key
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ================================
// FALLEN ANGELES – PNJ AVEC MÉMOIRE
// ================================
const fallenAngels = {

  "dexter mikey": {
    sexe: "Homme",
    classe: "Resident",
    social: "Neolitain",
    home: "Fallen Angeles",
    lifestyle: "Modeste",
    niveau: 5,
    cash: 1200,
    statut: "Libre",
    caractere: "amical",
    charisme: 20,

    likes: ["Musique", "Discussions"],
    dislikes: ["Autorité"],
    friends: ["@Damian", "mazikeen"],
    lovers: [],

    image: "",
    image_home: "",
    image_extra: "",

    habits: {
      sexual_acceptance: 35, // %
      flirt_acceptance: 60,
      conditions: [
        "Relation de confiance",
        "Discussion préalable"
      ],
      refuse: [
        "Violence",
        "Manipulation"
      ],
      comportement: "Répond calmement et cherche le dialogue"
    }
  },

  "azrael": {
    sexe: "Femme",
    classe: "Ange de la Mort",
    social: "Solitaire",
    home: "Cathédrale abandonnée",
    lifestyle: "Austère",
    niveau: 40,
    cash: 0,
    statut: "Éternelle",
    caractere: "froid",
    charisme: 85,

    likes: ["Silence", "Équilibre"],
    dislikes: ["Chaos"],
    friends: [],
    lovers: [],

    image: "",
    image_home: "",
    image_extra: "",

    habits: {
      sexual_acceptance: 0,
      flirt_acceptance: 5,
      conditions: ["Lien spirituel fort"],
      refuse: ["Contacts physiques", "Séduction directe"],
      comportement: "Réponses courtes, neutres, détachées"
    }
  },

  "lilith": {
    sexe: "Femme",
    classe: "Démone Originelle",
    social: "Élite",
    home: "Palais nocturne",
    lifestyle: "Luxueux",
    niveau: 90,
    cash: 999999,
    statut: "Dominante",
    caractere: "grossier",
    charisme: 96,

    likes: ["Pouvoir", "Séduction"],
    dislikes: ["Soumission"],
    friends: ["lucifer morningstar", "@Damian"],
    lovers: ["lucifer morningstar"],

    image: "",
    image_home: "",
    image_extra: "",

    habits: {
      sexual_acceptance: 85,
      flirt_acceptance: 95,
      conditions: [
        "Soumission claire",
        "Jeu de pouvoir"
      ],
      refuse: ["Manque de respect"],
      comportement: "Provocante, dominante, langage cru"
    }
  },

  "belial": {
    sexe: "Homme",
    classe: "Prince Démon",
    social: "Noble",
    home: "Citadelle rouge",
    lifestyle: "Opulent",
    niveau: 70,
    cash: 300000,
    statut: "Stratège",
    caractere: "froid",
    charisme: 92,

    likes: ["Stratégie"],
    dislikes: ["Improvisation"],
    friends: [],
    lovers: [],

    image: "",
    image_home: "",
    image_extra: "",

    habits: {
      sexual_acceptance: 40,
      flirt_acceptance: 30,
      conditions: ["Intérêt politique"],
      refuse: ["Émotions inutiles"],
      comportement: "Calculateur et distant"
    }
  },

  "hela": {
    sexe: "Femme",
    classe: "Reine des Morts",
    social: "Élite",
    home: "Helheim",
    lifestyle: "Sombre",
    niveau: 95,
    cash: 666666,
    statut: "Souveraine",
    caractere: "froid",
    charisme: 97,

    likes: ["Âmes"],
    dislikes: ["Vie"],
    friends: [],
    lovers: ["@Damian"],

    image: "",
    image_home: "",
    image_extra: "",

    habits: {
      sexual_acceptance: 50,
      flirt_acceptance: 40,
      conditions: ["Lien émotionnel fort"],
      refuse: ["Jeux frivoles"],
      comportement: "Parle lentement, autoritaire"
    }
  }

  // 👉 Tu peux continuer jusqu’à 20+ PNJ sur ce modèle
};

// ================================
// CATÉGORIE SELON CHARISME
// ================================
function determineCategory(charisme) {
  if (charisme >= 95) return "mythique";
  if (charisme >= 85) return "légendaire";
  if (charisme >= 70) return "rare";
  return "commun";
}

// ================================
// PLACEMENT SOCIAL
// ================================
function determinePlacement(social) {
  if (social === "Élite") return "dominant";
  if (social === "Noble") return "influent";
  if (social === "Solitaire") return "neutre";
  return "marginal";
}

// ================================
// CRÉATION FICHE PNJ
// ================================
function createFallenAngelFromBase(key, data) {
  return {
    id: key,
    name: formatNameFromKey(key),
    ...data,
    category: determineCategory(data.charisme),
    placement: determinePlacement(data.social)
  };
}

// ================================
// GROUPER PAR PLACEMENT
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
// GÉNÉRATION GLOBALE
// ================================
function generateFallenAngelsFromBase(object) {
  const all = [];
  for (const [key, value] of Object.entries(object)) {
    all.push(createFallenAngelFromBase(key, value));
  }
  return groupFallenAngelsByPlacement(all);
}

// ================================
// EXPORT
// ================================
const groupedFallenAngels = generateFallenAngelsFromBase(fallenAngels);

module.exports = {
  fallenAngels,
  groupedFallenAngels,
  generateFallenAngelsFromBase
};
