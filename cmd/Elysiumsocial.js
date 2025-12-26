// ================================
// PNJ HANDLER – Fallen Angeles
// ================================

const OpenAI = require("openai");
const { fallenAngeles } = require("./fallenAngelesDB"); // Base de données
const { ovlcmd } = require("../lib/ovlcmd"); // Si nécessaire
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ----------------------------
// UTILITAIRES
// ----------------------------
function formatNameFromKey(key) {
  return key
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ----------------------------
// RELATION DYNAMIQUE
// ----------------------------
function updateRelation(pnj, playerTag, delta) {
  pnj.memory[playerTag] = pnj.memory[playerTag] || { relation: 5, status: "Inconnu😶", events: [] };
  pnj.memory[playerTag].relation += delta;
  if (pnj.memory[playerTag].relation < 0) pnj.memory[playerTag].relation = 0;
  if (pnj.memory[playerTag].relation > 100) pnj.memory[playerTag].relation = 100;

  const r = pnj.memory[playerTag].relation;
  if (r <= 5) pnj.memory[playerTag].status = "Inconnu😶";
  else if (r <= 10) pnj.memory[playerTag].status = "Connaissance👋🏻";
  else if (r <= 50) pnj.memory[playerTag].status = "Ami🙂";
  else if (r <= 100) pnj.memory[playerTag].status = "Pote😄";
}

// ----------------------------
// CALCUL FLIRT & SEX
// ----------------------------
function calcFlirtAcceptance(pnj, player) {
  let chance = pnj.habits.flirt_acceptance || 50;
  if (player.charisme >= pnj.charisme && player.niveau >= pnj.niveau && player.lifestyle >= pnj.lifestyle) chance += 30;
  return Math.min(chance, 95);
}

function canHaveSex(pnj, player, location) {
  const memory = pnj.memory[player.tag] || [];
  const successfulFlirts = memory.filter(m => m.type === "flirt" && m.success).length;
  if (successfulFlirts >= 3 && location.toLowerCase().includes("club")) {
    return Math.random() * 100 < (pnj.habits.sexual_acceptance || 50);
  }
  return false;
}

// ----------------------------
// SUJETS D’INTÉRÊT
// ----------------------------
const topics = ["Art", "Sport", "Aventures", "Monde", "Actualité", "Musique", "Science", "Hi-tech", "Société", "Fashion", "Showbiz", "Criminalité", "Loisirs", "Animaux", "Delerium", "Études", "Fêtes", "Politique", "Gaming"];

function extractSubject(text) {
  const lowerText = text.toLowerCase();
  for (const t of topics) {
    if (lowerText.includes(t.toLowerCase())) return t;
  }
  return null;
}

// ----------------------------
// GÉNÉRATION RÉPONSE PNJ
// ----------------------------
async function handlePNJMessage(player, message, location = "") {
  let pnjKey = null;

  // Identifier PNJ dans le message
  for (const key of Object.keys(fallenAngeles)) {
    const regex = new RegExp(key, "i");
    if (regex.test(message)) {
      pnjKey = key.toLowerCase();
      break;
    }
  }
  if (!pnjKey) return { caption: "PNJ non trouvé", image: "" };

  const pnj = fallenAngeles[pnjKey];
  pnj.memory = pnj.memory || {};
  pnj.memory[player.tag] = pnj.memory[player.tag] || { relation: 5, status: "Inconnu😶", events: [] };

  const subject = extractSubject(message);
  let replyText = "";

  // ----------------------------
  // Vérifier sujet
  // ----------------------------
  if (subject && pnj.likes.includes(subject)) {
    // Sujet aimé, 60% de chance de réussite
    if (Math.random() * 100 < 60) {
      replyText = `Oh intéressant ! Parlons de ${subject}.`;
      updateRelation(pnj, player.tag, +2);
    } else {
      replyText = `Hmm, je n'ai pas trop envie d'en parler maintenant.`;
      updateRelation(pnj, player.tag, -2);
    }
  } else if (subject) {
    replyText = `Je ne suis pas intéressé par ${subject}.`;
    updateRelation(pnj, player.tag, -2);
  } else if (/^je flirt:/i.test(message)) {
    const flirtChance = calcFlirtAcceptance(pnj, player);
    if (Math.random() * 100 < flirtChance && orientationCheck(pnj, player)) {
      replyText = `Hmm… j'aime ton compliment.`;
      updateRelation(pnj, player.tag, +2);
      pnj.memory[player.tag].events.push({ type: "flirt", success: true, date: new Date().toISOString() });
    } else {
      replyText = `Je ne suis pas intéressé par ton flirt.`;
      updateRelation(pnj, player.tag, -2);
      pnj.memory[player.tag].events.push({ type: "flirt", success: false, date: new Date().toISOString() });
    }
  } else if (/^je propose de coucher ensemble/i.test(message)) {
    if (canHaveSex(pnj, player, location) && orientationCheck(pnj, player)) {
      replyText = `D'accord… faisons-le.`;
      pnj.memory[player.tag].events.push({ type: "sexual", success: true, location, date: new Date().toISOString() });
    } else {
      replyText = `Non merci, pas intéressé.`;
      pnj.memory[player.tag].events.push({ type: "sexual", success: false, location, date: new Date().toISOString() });
      updateRelation(pnj, player.tag, -2);
    }
  } else {
    replyText = `Je ne comprends pas ce que tu veux dire.`;
  }

  // ----------------------------
  // Caption
  // ----------------------------
  const caption = `${pnjKey.charAt(0).toUpperCase() + pnjKey.slice(1)}   |   Relation avec ${player.tag}: ${pnj.memory[player.tag].status}
▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░
💬 ${replyText}

▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░
                              💠▯▯▯▯▯▯⎢⎢⎢⎢⎢`;

  return { caption, image: pnj.image };
}

// ----------------------------
// ORIENTATION SEXUELLE
// ----------------------------
function orientationCheck(pnj, player) {
  // Homme, Femme, Gay, Lesbienne, Bisexual
  if (pnj.orientation.toLowerCase() === "bisexual") return true;
  if (pnj.orientation.toLowerCase() === "homme" && player.sexe.toLowerCase() === "H") return true;
  if (pnj.orientation.toLowerCase() === "femme" && player.sexe.toLowerCase() === "F") return true;
  if (pnj.orientation.toLowerCase() === "gay" && player.sexe.toLowerCase() === "H") return true;
  if (pnj.orientation.toLowerCase() === "lesbienne" && player.sexe.toLowerCase() === "F") return true;
  return false;
}

// ----------------------------
// EXPORT
// ----------------------------
module.exports = {
  handlePNJMessage,
  fallenAngeles
};
