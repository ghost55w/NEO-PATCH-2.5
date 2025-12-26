const OpenAI = require("openai");
const { fallenAngeles } = require("./fallenAngelesDB"); // Nouvelle base PNJ
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
  const memory = pnj.memory[player.tag] || [];
  const successfulFlirts = memory.events ? memory.events.filter(m => m.type === "flirt" && m.success).length : 0;
  if (successfulFlirts >= 3 && location.toLowerCase().includes("club")) {
    return Math.random() * 100 < (pnj.habits.sexual_acceptance || 50);
  }
  return false;
}

// ----------------
// HANDLE MESSAGE
// ----------------
async function handlePNJMessage(player, text, location = "") {
  // Vérifier trigger PNJ
  const match = text.match(/j'aborde (\w+)\s*💬\s*(.*)/i);
  if (!match) throw new Error("Message mal formaté ou pas de PNJ détecté.");

  const pnjKey = match[1].toLowerCase();
  const actionText = match[2].trim();
  const pnj = fallenAngeles[pnjKey];
  if (!pnj) throw new Error("PNJ introuvable.");

  // Vérifier orientation
  if (
    (pnj.orientation === "homme" && player.sexe !== "H") ||
    (pnj.orientation === "femme" && player.sexe !== "F") ||
    (pnj.orientation === "gay" && player.sexe !== "H") ||
    (pnj.orientation === "lesbienne" && player.sexe !== "F")
  ) {
    return {
      caption: `${pnj.name} ne s'intéresse pas à toi 😶`,
      image: pnj.image
    };
  }

  // Init mémoire
  pnj.memory = pnj.memory || {};
  pnj.memory[player.tag] = pnj.memory[player.tag] || { relation: 5, status: "Inconnu😶", events: [] };

  // Détecter le type d'action
  let actionType = "talk";
  if (/^je flirt:/i.test(actionText)) actionType = "flirt";
  if (/^je propose de coucher ensemble/i.test(actionText)) actionType = "sexual";

  // Vérifier sujet pour discussion
  const topicMatch = actionText.match(/je parle de:\s*(.*)/i);
  const topic = topicMatch ? topicMatch[1].trim() : "";

  let likesSubject = pnj.likes.includes(topic);
  let successTalk = false;

  if (actionType === "talk") {
    if (likesSubject) {
      successTalk = Math.random() * 100 < 60; // 60% chance si topic aimé
      updateRelation(pnj, player.tag, successTalk ? +2 : 0);
    } else {
      // Sujet non aimé
      updateRelation(pnj, player.tag, -2);
      return {
        caption: `*${pnj.name}:*   |   *Relation avec ${player.tag}:* ${pnj.memory[player.tag].status}
▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░
💬 Désolé, ce sujet ne m'intéresse pas.

▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░
                              💠▯▯▯▯▯▯⎢⎢⎢⎢⎢`,
        image: pnj.image
      };
    }
  }

  // Calcul flirt
  let flirtSuccess = false;
  if (actionType === "flirt") {
    const chance = calcFlirtAcceptance(pnj, player);
    flirtSuccess = Math.random() * 100 < chance;
    if (flirtSuccess) updateRelation(pnj, player.tag, +2);
    else updateRelation(pnj, player.tag, -2);
  }

  // Calcul sexe
  let sexSuccess = false;
  if (actionType === "sexual") sexSuccess = canHaveSex(pnj, player, location);

  // Historique mémoire
  pnj.memory[player.tag].events.push({
    type: actionType,
    success: actionType !== "talk" ? flirtSuccess || sexSuccess : successTalk,
    date: new Date().toISOString(),
    topic: topic
  });

  // Prompt OpenAI
  const prompt = `
Tu es ${pnj.name}, PNJ du jeu Fallen Angeles.
Caractère: ${pnj.caractere}, social: ${pnj.social}, placement: ${pnj.placement}.
Mémoire avec ${player.tag}:
${pnj.memory[player.tag].events.map(e => `${e.type}: ${e.success ? "réussi" : "échoué"} ${e.topic || ""} le ${e.date}`).join("\n")}

Le joueur dit: "${actionText}"
Sujet: "${topic}"
Lieu: ${location}
ActionType: ${actionType}

Répond RP selon ton caractère:
- Refuse poliment ou sèchement les sujets non appréciés.
- Mentionne subtilement flirt si accepté (${flirtSuccess ? "oui" : "non"}).
- Mentionne opportunité sexuelle si possible (${sexSuccess ? "oui" : "non"}).
- Utilise tutoiement.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 500
  });

  const replyText = response.choices[0].message.content;

  // Construire caption
  const caption = `*${pnj.name}:*   |   *Relation avec ${player.tag}:* ${pnj.memory[player.tag].status}
▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░
💬 ${replyText}

▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░
                              💠▯▯▯▯▯▯⎢⎢⎢⎢⎢`;

  return { caption, image: pnj.image };
}

// ----------------
// EXPORT
// ----------------
module.exports = {
  fallenAngeles,
  handlePNJMessage
};
