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

// --- Commande principale ElysiumME💠 (fiche complète) ---
function addPlayerFiche(jid) {
  if (registeredPlayers.has(jid)) return;
  registeredPlayers.add(jid);

  ovlcmd({
    nom_cmd: "elysiumme💠",
    classe: "Elysium",
    react: "💠"
  }, async (ms_org, ovl, cmd_options) => {
    const { repondre, ms, arg } = cmd_options;
    try {
      console.log("[ELYME] Commande déclenchée pour JID:", jid, "arg:", arg);

      const data = await PlayerFunctions.getPlayer(jid);
      console.log("[ELYME] Fiche récupérée:", data);

      if (!data) return repondre("❌ Aucune fiche trouvée.");

      data.cyberwares = data.cyberwares || "";  
      data.oc_url = data.oc_url || ""; // GIF / image  

      const cyberwaresCount = data.cyberwares  
        ? data.cyberwares.split("\n").filter(c => c.trim() !== "").length  
        : 0;  

      if (!arg.length) {  
        const fiche = `➤ ──⦿ P L A Y E R | ⦿──

▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░░
🫆Pseudo:  ➤ ${data.pseudo}
🫆User:    ➤ ${data.user}
⏫Exp:     ➤ ${data.exp}/4000 \`XP\`
🔰Niveau:  ➤ ${data.niveau} ▲
🎖️Rang:   ➤ ${data.rang}
🛄Infos:   ➤

▒▒▒░░ \`P L A Y E R\` 💠
▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░░
💲ECash:       ➤ ${data.ecash} \`E¢\`
🌟Lifestyle:  ➤ ${data.lifestyle} 🌟
⭐Charisme:   ➤ ${data.charisme} ⭐
🫱🏼‍🫲🏽Réputation: ➤ ${data.reputation} 🫱🏼‍🫲🏽

---

+HUD💠        ➤ ( 𝗂𝗇𝗍𝖾𝗋𝖿𝖺𝖼𝖾 𝖽𝖾 𝗃𝗈𝗎𝖾𝗎𝗋 )
+Inventaire💠 ➤ ( Propriétés )

░▒▒▒▒░ \`C Y B E R W A R E S\` 💠
🩻Cyberwares : (Total) ➤ ${cyberwaresCount}
➤ ${data.cyberwares.split("\n").join(" • ") || "-"}

░▒▒▒▒░░▒░ \`S T A T S\` 💠
✅Missions: ➤ ${data.missions} ✅
❌Game over: ➤ ${data.gameover} ❌
🏆Elysium Games PVP: ➤ ${data.pvp} 🏆

👊🏽Points combat:     ➤ ${data.points_combat}
🪼Points chasse:      ➤ ${data.points_chasse}/4000 🪼
🪸Points récoltes:    ➤ ${data.points_recoltes}/4000 🪸
👾Points Hacking:     ➤ ${data.points_hacking}/4000 👾
🏁Points conduite:    ➤ ${data.points_conduite}/4000 🏁
🌍Points Exploration: ➤ ${data.points_exploration}/4000 🌍

░▒░▒░ \`A C H I E V M E N T S\` 💠
🏆Trophies: ${data.trophies} 🏆`;

        console.log("[ELYME] Envoi de la fiche au joueur");
        return ovl.sendMessage(ms_org, { image: { url: data.oc_url }, caption: fiche }, { quoted: ms || ms_org });  
      }  

      const updates = await processUpdates(arg, jid);  
      console.log("[ELYME] Updates à appliquer:", updates);

      for (const u of updates) {
        console.log(`[ELYME] Mise à jour colonne ${u.colonne}: ${u.oldValue} -> ${u.newValue}`);
        await PlayerFunctions.updatePlayer(jid, { [u.colonne]: u.newValue });  
      }

      const message = updates.map(u => `🛠️ *${u.colonne}* modifié : \`${u.oldValue}\` ➤ \`${u.newValue}\``).join("\n");  
      return repondre("✅ Fiche mise à jour avec succès !\n\n" + message);  

    } catch (err) {  
      console.error("[ELYME] Erreur dans +ElysiumMe💠:", err);  
      return repondre("❌ Une erreur est survenue.");  
    }
  });
}

// --- Commande +HUD💠 ---
ovlcmd({
  nom_cmd: "hud💠",
  classe: "Elysium",
  react: "💠"
}, async (ms_org, ovl, { repondre, arg }) => {
  try {
    console.log("[HUD] Commande déclenchée. Args:", arg);
    let jid = arg.length ? arg[0].replace(/[^\d]/g, "") : ms_org.sender; 
    console.log("[HUD] JID utilisé:", jid);

    const data = await PlayerFunctions.getPlayer(jid);  
    console.log("[HUD] Fiche récupérée:", data);

    if (!data) return repondre("❌ Aucune fiche trouvée.");  

    const hud = `➤ ──⦿ \`P L A Y E R\` | ⦿──

▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒
💬

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💠

░▒▒▒░░▒░░▒░ \`V I T A L S\`

> 🍗: ${data.besoins || 100}%    ❤️: ${data.pv || 100}%   💠: ${data.energie || 100}%
💪🏼: ${data.forme || 100}%    🫁: ${data.stamina || 100}%   🙂: ${data.plaisir || 100}%
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
🧠Intelligence: ${data.intelligence || 1}     👊🏽Force: ${data.force || 1}
🔍Gathering: ${data.gathering || 0}     ⚡Vitesse: ${data.vitesse || 1}
🛞Driving: ${data.driving || 0}        👁️Reflexes: ${data.reflexes || 1}
👾Hacking: ${data.hacking || 0}      🛡️Résistance: ${data.resistance || 1}

➤ \`+Package\`🎒 ➤ \`+Phone\`📱
▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░
💠▯▯▯▯▯▯⎢⎢⎢⎢⎢`;

    console.log("[HUD] Envoi HUD au joueur");
    return ovl.sendMessage(ms_org, { image: { url: data.oc_url }, caption: hud }, { quoted: ms_org });

  } catch (err) {
    console.error("[HUD] Erreur lors de l'affichage du HUD:", err);
    return repondre("❌ Erreur lors de l'affichage du HUD.");
  }
});

// --- Traitement des mises à jour stats ---
async function processUpdates(args, jid) {
  const updates = [];
  try {
    const data = await PlayerFunctions.getPlayer(jid);
    console.log("[UPDATE] processUpdates - Fiche récupérée:", data);

    const columns = [
      "pseudo","user","besoins","pv","energie","forme","stamina","plaisir",
      "intelligence","force","vitesse","reflexes","resistance",
      "gathering","driving","hacking",
      "cyberwares","exp","niveau","rang","ecash","lifestyle",
      "charisme","reputation","missions","gameover","pvp",
      "points_combat","points_chasse","points_recoltes",
      "points_hacking","points_conduite","points_exploration","trophies"
    ];

    let i = 0;
    while (i < args.length) {
      const object = args[i++];
      const signe = args[i++];
      let texte = [];

      while (i < args.length && !['+', '-', '=', 'add', 'supp'].includes(args[i]) && !columns.includes(args[i])) {  
        texte.push(args[i++]);  
      }  

      if (!columns.includes(object)) throw new Error(`❌ Colonne '${object}' non reconnue.`);  
      const oldValue = data[object];  
      let newValue;  

      if (signe === "+" || signe === "-") {  
        newValue = Number(oldValue || 0) + (signe === "+" ? Number(texte.join(" ")) : -Number(texte.join(" ")));  
      } else if (signe === "=") {  
        newValue = texte.join(" ");  
      } else if (signe === "add") {  
        newValue = (oldValue + " " + texte.join(" ")).trim();  
      } else if (signe === "supp") {  
        newValue = normalizeText(oldValue).replace(new RegExp(`\\b${normalizeText(texte.join(" "))}\\b`, "gi"), "").trim();  
      } else {  
        throw new Error(`❌ Signe non reconnu : ${signe}`);  
      }  

      console.log(`[UPDATE] Colonne ${object}: ${oldValue} -> ${newValue}`);
      updates.push({ colonne: object, oldValue, newValue });
    }
  } catch (err) {
    console.error("[UPDATE] Erreur dans processUpdates:", err);
    throw err;
  }

  return updates;
}

// --- Initialisation auto des fiches existantes ---
async function initPlayersAuto() {
  try {
    const all = await PlayerFunctions.getAllPlayers();
    console.log("[INIT] Joueurs récupérés:", all.map(p => p.id));
    for (const player of all) {
      if (!player.id) continue;
      addPlayerFiche(player.id);
    }
  } catch (e) {
    console.error("[INIT] Erreur d'initPlayersAuto:", e);
  }
}

initPlayersAuto();


// --- Commande +add💠 ---
ovlcmd({
  nom_cmd: "add💠",
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
      besoins: 100,
      pv: 100,
      energie: 100,
      forme: 100,
      stamina: 100,
      plaisir: 100,
      intelligence: 1,
      force: 1,
      vitesse: 1,
      reflexes: 1,
      resistance: 1,
      gathering: 0,
      driving: 0,
      hacking: 0,
      cyberwares: "",
      exp: 0,
      niveau: 1,
      rang: "Novice🥉",
      ecash: 50000,
      lifestyle: 0,
      charisme: 0,
      reputation: 0,
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

// --- Commande +del💠 ---
ovlcmd({
  nom_cmd: "del💠",
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

// --- Commande pour modifier le oc_url d'un joueur ---
ovlcmd({
  nom_cmd: "+oc💠",
  classe: "Elysium",
  react: "🖼️"
}, async (ms_org, ovl, { repondre, arg }) => {
  if (arg.length < 3) return repondre("❌ Syntaxe : +oc💠 @tag = [lien fichier Catbox]");

  try {
    // Récupération du JID à partir du tag
    const jid = arg[0].replace(/[^\d]/g, "");
    if (!jid) return repondre("❌ Impossible de récupérer le JID.");

    const colonne = arg[1]; // doit être oc_url
    const signe = arg[2];   // doit être "="

    if (colonne !== "oc_url" || signe !== "=") 
      return repondre("❌ Syntaxe invalide. Utilise : oc_url = [lien]");

    const newValue = arg.slice(3).join(" ").trim();
    if (!newValue) return repondre("❌ Fournis un lien valide pour l'image/GIF Catbox.");

    // Vérification que le joueur existe
    const data = await PlayerFunctions.getPlayer(jid);
    if (!data) return repondre("❌ Joueur introuvable.");

    // Mise à jour du oc_url
    await PlayerFunctions.updatePlayer(jid, { oc_url: newValue });

    return repondre(`✅ Image/GIF du joueur ${data.pseudo} mise à jour avec succès !`);
    
  } catch (err) {
    console.error(err);
    return repondre("❌ Erreur lors de la mise à jour du oc_url.");
  }
});
