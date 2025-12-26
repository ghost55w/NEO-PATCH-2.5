const { ovlcmd } = require("../lib/ovlcmd");
const { PlayerFunctions } = require('../DataBase/ElysiumFichesDB');

const registeredPlayers = new Set();

// --- Utilitaires ---
function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// --- Ajout de la commande principale ElysiumME💠 ---
function addPlayerFiche(jid) {
  if (registeredPlayers.has(jid)) return;
  registeredPlayers.add(jid);

  ovlcmd({
    nom_cmd: "elysiumME💠",
    classe: "Elysium",
    react: "💠"
  }, async (ms_org, ovl, cmd_options) => {
    const { repondre, ms, arg } = cmd_options;

    try {
      const data = await PlayerFunctions.getPlayer(jid);
      if (!data) return repondre("❌ Aucune fiche trouvée.");

      // --- Affichage de la fiche ---
      if (!arg.length) {
        const cyberwaresCount = data.cyberwares
          ? data.cyberwares.split("\n").filter(c => c.trim() !== "").length
          : 0;

        const fiche = `➤ ──⦿ P L A Y E R | ⦿──
▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░░
*🫆Pseudo:*  ➤ ${data.pseudo}
*🫆User:*    ➤ ${data.user}
*⏫Exp:*     ➤ ${data.exp}/4000 \`XP\`
*🔰Niveau:*  ➤ ${data.niveau} ▲
*🎖️Rang:*   ➤ ${data.rang}
*🛄Infos:*   ➤

▒▒▒░░ \`P L A Y E R\` 💠
▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░░
*💲ECash*:       ➤ ${data.ecash} \`E¢\`
*🌟Lifestyle*:  ➤ ${data.lifestyle} 🌟
*⭐Charisme*:   ➤ ${data.charisme} ⭐
*🫱🏼‍🫲🏽Réputation:* ➤ ${data.reputation} 🫱🏼‍🫲🏽
__________________________

*+Me💠*        ➤ ( 𝗂𝗇𝗍𝖾𝗋𝖿𝖺𝖼𝖾 𝖽𝖾 𝗃𝗈𝗎𝖾𝗎𝗋 )
*`Inventaire`💠* ➤ ( Propriétés )

░▒▒▒▒░ \`C Y B E R W A R E S\` 💠
*🩻Cyberwares :* (Total) ➤ ${cyberwaresCount}
➤ ${data.cyberwares.split("\n").join(" • ") || "-"}

░▒▒▒▒░░▒░ \`S T A T S\` 💠
*✅Missions:* ➤ ${data.missions} ✅
*❌Game over:* ➤ ${data.gameover} ❌
*🏆Elysium Games PVP:* ➤ ${data.pvp} 🏆

*👊🏽Points combat:*     ➤ ${data.points_combat}
*🪼Points chasse:*      ➤ ${data.points_chasse}/4000 🪼
*🪸Points récoltes:*    ➤ ${data.points_recoltes}/4000 🪸
*👾Points Hacking:*     ➤ ${data.points_hacking}/4000 👾
*🏁Points conduite:*    ➤ ${data.points_conduite}/4000 🏁
*🌍Points Exploration:* ➤ ${data.points_exploration}/4000 🌍

░▒░▒░ \`A C H I E V M E N T S\` 💠
*🏆Trophies:* ${data.trophies} 🏆`;

        return ovl.sendMessage(ms_org, { caption: fiche, image: { url: data.oc_url } }, { quoted: ms });
      }
    } catch (err) {
      console.error(err);
      return repondre("❌ Une erreur est survenue. Vérifie les paramètres.");
    }
  });
}

// --- Initialisation auto des fiches existantes ---
async function initPlayersAuto() {
  try {
    const all = await PlayerFunctions.getAllPlayers();
    for (const player of all) {
      if (!player.id) continue;
      addPlayerFiche(player.id);
    }
  } catch (e) {
    console.error("Erreur d'initPlayersAuto:", e);
  }
}

initPlayersAuto();

// --- Commande pour ajouter un joueur ---
ovlcmd({
  nom_cmd: "+add💠",
  classe: "Elysium",
  react: "➕"
}, async (ms_org, ovl, { repondre, arg }) => {
  if (arg.length < 1) return repondre("❌ Syntaxe : +add💠 @tag");

  try {
    const jid = arg[0].replace(/[^\d]/g, "");
    if (!jid) return repondre("❌ Impossible de récupérer le JID.");

    const existing = await PlayerFunctions.getPlayer(jid);
    if (existing) return repondre("❌ Ce joueur possède déjà une fiche.");

    await PlayerFunctions.savePlayer(jid, {
      pseudo: "Nouveau Joueur",
      user: arg[0],
      exp: 0,
      niveau: 1,
      rang: "Novice🥉",
      ecash: 50000,
      lifestyle: 0,
      charisme: 0,
      reputation: 0,
      cyberwares: "",
      missions: 0,
      gameover: 0,
      pvp: 0,
      points_combat: 0,
      points_chasse: 0,
      points_recoltes: 0,
      points_hacking: 0,
      points_conduite: 0,
      points_exploration: 0,
      trophies: 0
    });

    addPlayerFiche(jid);

    return repondre(`✅ Fiche créée pour le joueur : ${arg[0]} (JID : ${jid})`);
  } catch (err) {
    console.error(err);
    return repondre("❌ Erreur lors de la création de la fiche.");
  }
});

// --- Commande pour supprimer un joueur ---
ovlcmd({
  nom_cmd: "+del💠",
  classe: "Elysium",
  react: "🗑️"
}, async (ms_org, ovl, { repondre, arg }) => {
  if (arg.length < 1) return repondre("❌ Syntaxe : +del💠 @tag");

  try {
    const jid = arg[0].replace(/[^\d]/g, "");
    if (!jid) return repondre("❌ Impossible de récupérer le JID.");

    const deleted = await PlayerFunctions.deletePlayer(jid);
    if (!deleted) return repondre("❌ Aucune fiche trouvée pour ce joueur.");

    registeredPlayers.delete(jid);

    return repondre(`✅ Fiche supprimée pour le joueur : ${arg[0]} (JID : ${jid})`);
  } catch (err) {
    console.error(err);
    return repondre("❌ Erreur lors de la suppression de la fiche.");
  }
});
