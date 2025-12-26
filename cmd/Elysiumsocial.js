const OpenAI = require("openai");
const { fallenAngeles } = require("./fallenAngelesDB"); 
const { ovlcmd } = require("../lib/ovlcmd"); 
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ----------------
// UTILITAIRES
// ----------------
function formatNameFromKey(key) {
  return key
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ----------------
// RELATION DYNAMIQUE
// ----------------
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

// ----------------
// CALCUL FLIRT & SEX
// ----------------
function calcFlirtAcceptance(pnj, player) {
  let chance = pnj.habits.flirt_acceptance || 50;
  if (
    player.charisme >= pnj.charisme &&
    player.niveau >= pnj.niveau &&
    player.lifestyle >= pnj.lifestyle
  ) chance += 30;
  return Math.min(chance, 95);
}

function canHaveSex(pnj, player, location) {
  const memory = pnj.memory[player.tag]?.events || [];
  const successfulFlirts = memory.filter(m => m.type === "flirt" && m.success).length;
  if (successfulFlirts >= 3 && location.toLowerCase().includes("club")) {
    return Math.random() * 100 < (pnj.habits.sexual_acceptance || 50);
  }
  return false;
}

// ----------------
// DÉTECTION SUJETS AIMÉS
// ----------------
function isTopicLiked(pnj, topic) {
  return pnj.likes.includes(topic);
}

// ----------------
// RÉPONSE RP
// ----------------
async function getPNJResponse(pnjKey, player, message, topic, location = "") {
  const pnj = fallenAngeles[pnjKey.toLowerCase()];
  if (!pnj) throw new Error("PNJ introuvable");

  // Init mémoire joueur
  pnj.memory = pnj.memory || {};
  pnj.memory[player.tag] = pnj.memory[player.tag] || { relation: 5, status: "Inconnu😶", events: [] };

  const msgLower = message.toLowerCase();

  // ----------------
  // Commandes spéciales Flirt / Sex
  // ----------------
  let isFlirt = msgLower.startsWith("je flirt:");
  let isSex = msgLower === "je propose de coucher ensemble";
  let replyText = "";

  if (isFlirt) {
    const flirtChance = calcFlirtAcceptance(pnj, player);
    const flirtSuccess = Math.random() * 100 < flirtChance;

    if (flirtSuccess) {
      pnj.memory[player.tag].events.push({ type: "flirt", success: true, date: new Date().toISOString() });
      replyText = "😉 J'apprécie ton compliment...";
      updateRelation(pnj, player.tag, +2);
    } else {
      pnj.memory[player.tag].events.push({ type: "flirt", success: false, date: new Date().toISOString() });
      replyText = "🙄 Je ne suis pas intéressé(e)...";
      updateRelation(pnj, player.tag, -2);
    }

    return { caption: buildCaption(pnj, player.tag, replyText), image: pnj.image };
  }

  if (isSex) {
    const sexSuccess = canHaveSex(pnj, player, location);
    if (sexSuccess) {
      pnj.memory[player.tag].events.push({
        type: "sexual",
        success: true,
        date: new Date().toISOString(),
        location
      });
      replyText = "🔥 Très bien, nous pouvons continuer...";
      updateRelation(pnj, player.tag, +5);
    } else {
      replyText = "❌ Je ne suis pas intéressé(e) pour le moment.";
      updateRelation(pnj, player.tag, -2);
    }

    return { caption: buildCaption(pnj, player.tag, replyText), image: pnj.image };
  }

  // ----------------
  // Conversation normale
  // ----------------
  const likesTopic = isTopicLiked(pnj, topic);
  if (!likesTopic) {
    replyText = "🙄 Ce sujet ne m'intéresse pas.";
    updateRelation(pnj, player.tag, -2);
    return { caption: buildCaption(pnj, player.tag, replyText), image: pnj.image };
  }

  // 60% de chance de réussite si sujet aimé
  const conversationSuccess = Math.random() * 100 < 60;
  if (conversationSuccess) updateRelation(pnj, player.tag, +2);
  else updateRelation(pnj, player.tag, -1);

  // Historique mémoire
  pnj.memory[player.tag].events.push({ type: "event", detail: `Discussion sur ${topic}`, date: new Date().toISOString() });

  // Prompt OpenAI
  const memorySummary = pnj.memory[player.tag].events.map(e => {
    if (e.type === "flirt") return `Flirt: ${e.success ? "réussi" : "échoué"} le ${e.date}`;
    if (e.type === "sexual") return `Sexual: ${e.success ? "accepté" : "refusé"} le ${e.date} à ${e.location || ""}`;
    if (e.type === "event") return `Événement: ${e.detail} le ${e.date}`;
    return "";
  }).join("\n") || "Aucune interaction passée.";

  const prompt = `
Tu es ${pnj.name}, PNJ du jeu Fallen Angeles.
Caractère: ${pnj.caractere}, social: ${pnj.social}, placement: ${pnj.placement}.
Mémoire avec ${player.tag}:
${memorySummary}

Le joueur dit: "${message}"
Sujet: "${topic}"
Lieu: ${location}

Répond RP selon ton caractère :
- Refuse poliment ou sèchement les sujets non appréciés.
- Intègre mémoire et événements passés si pertinents.
- Mentionne subtilement flirt si applicable.
- Mentionne opportunité sexuelle si possible.
- Utilise tutoiement.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 500
  });

  replyText = response.choices[0].message.content;

  return { caption: buildCaption(pnj, player.tag, replyText), image: pnj.image };
}

// ----------------
// BUILD CAPTION
// ----------------
function buildCaption(pnj, playerTag, replyText) {
  return `*${pnj.name}:*   |   *Relation avec ${playerTag}:* ${pnj.memory[playerTag].status}
▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░
💬 ${replyText}

▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░
                              💠▯▯▯▯▯▯⎢⎢⎢⎢⎢`;
}

// ----------------
// EXPORT
// ----------------
module.exports = {
  fallenAngeles,
  getPNJResponse
};
