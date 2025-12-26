const { ovlcmd } = require("../lib/ovlcmd");
const { getData, setfiche, getAllFiches, add_id, del_fiche } = require('../DataBase/cyber_player_fiches');

const registeredPlayers = new Set();

// --- Utilitaires ---
function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function addPlayerFiche(nom_joueur, jid, joueur_div) {
  if (registeredPlayers.has(nom_joueur)) return;
  registeredPlayers.add(nom_joueur);

  ovlcmd({
    nom_cmd: elysiumMe💠,
    classe: Elysium,
    react: "💠"
  }, async (ms_org, ovl, cmd_options) => {
    const { repondre, ms, arg, prenium_id } = cmd_options;

    try {
      const data = await getData({ jid });

      // Valeurs par défaut
      data.exp = data.exp ?? 0;
      data.niveau = data.niveau ?? 1;
      data.rang = data.rang ?? "Novice🥉";
      data.ecash = data.ecash ?? 50000;
      data.lifestyle = data.lifestyle ?? 0;
      data.charisme = data.charisme ?? 0;
      data.reputation = data.reputation ?? 0;
      data.cyberwares = data.cyberwares ?? "";
      data.missions = data.missions ?? 0;
      data.gameover = data.gameover ?? 0;
      data.pvp = data.pvp ?? 0;
      data.points_combat = data.points_combat ?? 0;
      data.points_chasse = data.points_chasse ?? 0;
      data.points_recoltes = data.points_recoltes ?? 0;
      data.points_hacking = data.points_hacking ?? 0;
      data.points_conduite = data.points_conduite ?? 0;
      data.points_exploration = data.points_exploration ?? 0;
      data.trophies = data.trophies ?? 0;

      // Affichage de la fiche
      if (!arg.length) {
        const fiche = `➤ ──⦿ P L A Y E R | ⦿──
▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░░
*🫆Pseudo:*  ➤ ${data.pseudo || "-"}
*🫆User:*    ➤ ${data.user || "-"}
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

*+Me💠*        ➤ ( 𝗂𝗇𝗍𝖾𝗋𝖿𝖺𝖼𝖾 𝖽𝖾 𝗃𝗈𝗎𝖾𝗎𝗋 )
*+Inventaire💠* ➤ ( Propriétés )

░▒▒▒▒░ \`C Y B E R W A R E S\` 💠
*🩻Cyberwares :* (Total) ➤ ${data.cyberwares || "-"}

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

      if (!prenium_id) return await repondre("⛔ Accès refusé ! Seuls les membres premium peuvent faire ça.");

      // Traitement des mises à jour
      const updates = await processUpdates(arg, jid);
      await updatePlayerData(updates, jid);

      const message = updates.map(u => `🛠️ *${u.colonne}* modifié : \`${u.oldValue}\` ➤ \`${u.newValue}\``).join('\n');
      await repondre("✅ Fiche mise à jour avec succès !\n\n" + message);

    } catch (err) {
      console.error(err);
      await repondre("❌ Une erreur est survenue. Vérifie les paramètres.");
    }
  });
}

// --- Traitement des updates ---
async function processUpdates(args, jid) {
  const updates = [];
  const data = await getData({ jid });
  const columns = Object.keys(data.dataValues);

  let i = 0;
  while (i < args.length) {
    const object = args[i++];
    const signe = args[i++];
    let texte = [];

    while (i < args.length && !['+', '-', '=', 'add', 'supp'].includes(args[i]) && !columns.includes(args[i])) {
      texte.push(args[i++]);
    }

    if (!columns.includes(object)) throw new Error(`❌ La colonne '${object}' n'existe pas.`);
    const oldValue = data[object];
    let newValue;

    if (signe === "+" || signe === "-") {
      newValue = Number(oldValue || 0) + (signe === "+" ? Number(texte.join(" ")) : -Number(texte.join(" ")));
    } else if (signe === "=") {
      newValue = texte.join(" ");
    } else if (signe === "add") {
      newValue = (oldValue + " " + texte.join(" ")).trim();
    } else if (signe === "supp") {
      const regex = new RegExp(`\\b${normalizeText(texte.join(" "))}\\b`, "gi");
      newValue = normalizeText(oldValue).replace(regex, "").trim();
    } else {
      throw new Error(`❌ Signe non reconnu : ${signe}`);
    }

    updates.push({ colonne: object, oldValue, newValue });
  }

  return updates;
}

async function updatePlayerData(updates, jid) {
  for (const update of updates) {
    await setfiche(update.colonne, update.newValue, jid);
  }
}

async function initPlayersAuto() {
  try {
    const all = await getAllFiches();
    for (const player of all) {
      if (!player.code_fiche || player.code_fiche === "pas de fiche" || !player.id) continue;
      addPlayerFiche(player.code_fiche, player.jid, player.division);
    }
  } catch (e) {
    console.error("Erreur d'initPlayersAuto:", e);
  }
}

initPlayersAuto();
