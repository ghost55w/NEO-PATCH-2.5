const { ovlcmd } = require('../lib/ovlcmd');
const { MyNeoFunctions } = require("../DataBase/myneo_lineup_team");
const { getData, setfiche } = require("../DataBase/allstars_divs_fiches");
const { cardsBlueLock } = require("../DataBase/cardsBL");
const { TeamFunctions } = require("../DataBase/myneo_lineup_team");
const { BlueLockFunctions } = require("../DataBase/myneo_lineup_team");
const { getUserData: getLineup, updatePlayers } = BlueLockFunctions;
const config = require("../set");

// --- UTILITAIRES ---
const formatNumber = n => {
  try { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  catch { return n; }
};

// --- EMOJI PAYS SÉCURISÉS ---
const countryEmojis = {
  "Japan": "\u{1F1EF}\u{1F1F5}",    // 🇯🇵
  "France": "\u{1F1EB}\u{1F1F7}",   // 🇫🇷
  "Brazil": "\u{1F1E7}\u{1F1F7}",   // 🇧🇷
  "Germany": "\u{1F1E9}\u{1F1EA}",  // 🇩🇪
  "Malta": "\u{1F1F2}\u{1F1F9}",    // 🇲🇹
  // ajoute tous les pays nécessaires
};
const getCountryEmoji = country => countryEmojis[country] || "";

// --- RANK LIMITS ---
const rankLimits = {
  "SS": { niveau: 10, goals: 30 },
  "S": { niveau: 5, goals: 15 },
  "A": { niveau: 3, goals: 5 }
};

// --- NOM PUR pour comparaison (très robuste) ---
const pureName = str => {
  if (!str) return "";
  return String(str)
    .replace(/\(.+?\)/g, "")                        // supprime tout entre parenthèses
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")         // supprime les drapeaux (regional indicators)
    // supprime la plupart des emojis (utilise \p{Emoji} si ton Node le supporte)
    .replace(/\p{Emoji}/gu, "")                     // <-- si ton Node supporte \p{Emoji}
    // Si ton Node ne supporte pas \p{Emoji}, remplace la ligne ci-dessus par la suivante :
    // .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[^0-9a-zA-ZÀ-ÿ\s]/g, " ")             // remplace tout caractère spécial par espace
    .replace(/\s+/g, " ")                           // collapse espaces
    .trim()
    .toLowerCase();
};

// --- CALCUL DU PRIX ---
function calculPrix(card) {
  let baseRankPrice = {
    "S": 1_000_000,
    "SS": 3_000_000
  }[card.rank] || 100_000;

  let ovr = Number(card.ovr || 0);  
  let bonusOvr = ovr * 1000;  

  return baseRankPrice + bonusOvr;
}

// --- TRANSFORMATION DES CARTES ---
const allCards = Object.entries(cardsBlueLock).map(([key, c]) => {
  const fullCard = { id: key, ...c };
  return {
    ...fullCard,
    price: calculPrix(fullCard),
    countryEmoji: getCountryEmoji(c.country)
  };
});

// --- ADD TO LINEUP ---
async function addToLineup(auteur_Message, card, ovl, ms_org, repondre) {
  try {
    let ficheLineup = await getLineup(auteur_Message);  
    if (!ficheLineup) return false;  

    ficheLineup = ficheLineup.toJSON ? ficheLineup.toJSON() : ficheLineup;

    const freePositions = [];  
    for (let i = 1; i <= 15; i++) {  
      if (!ficheLineup[`joueur${i}`] || ficheLineup[`joueur${i}`].trim() === "") {  
        ficheLineup[`joueur${i}`] = "aucun";  
      }  
      if (ficheLineup[`joueur${i}`] === "aucun") freePositions.push(i);  
    }  

    if (freePositions.length === 0) {  
      await repondre("❌ Tu n’as plus de place dans ton lineup !");  
      return false;  
    }  

    await repondre(`⚽✅ Carte achetée : ${card.name} (${card.ovr})${card.countryEmoji}
🔷Choisis la position où la placer dans ton lineup (1-15).
Positions libres : ${freePositions.map(i => `J${i}`).join(", ")}
╰───────────────────
                            *BLUE🔷LOCK⚽*`);

    const waitFor = async (timeout = 60000) => {  
      try {  
        const r = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: timeout });  
        return (r?.message?.extendedTextMessage?.text || r?.message?.conversation || "").trim().toLowerCase();  
      } catch { return ""; }  
    };  

    const posMsg = await waitFor();  
    if (!posMsg) return false;  

    const match = posMsg.match(/j(\d+)/i);  
    const numPos = match ? parseInt(match[1], 10) : null;  

    if (!numPos || !freePositions.includes(numPos)) {  
      await repondre("❌ Position invalide ou déjà occupée !");  
      return false;  
    }  

    ficheLineup[`joueur${numPos}`] = `${card.name} (${card.ovr})${card.countryEmoji}`;
    await updatePlayers(auteur_Message, ficheLineup);  

    await repondre(`✅ ${card.name} placé en position J${numPos} ✔️`);  
    return true;  

  } catch (err) {  
    console.error("❌ Erreur addToLineup:", err);  
    await repondre("❌ Erreur interne lors du placement de la carte.");  
    return false;  
  }
}

// --- BOUTIQUE BLUE LOCK ---
ovlcmd({
  nom_cmd: "boutiquebl",
  react: "⚽",
  classe: "NEO_GAMES⚽"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {
  try {
    let userData = await MyNeoFunctions.getUserData(auteur_Message);
    let fiche = await getData({ jid: auteur_Message });
    if (!userData || !fiche) return repondre("❌ Impossible de récupérer ta fiche.");

    let ficheTeam = await TeamFunctions.getUserData(auteur_Message);  
    ficheTeam.argent = Number(ficheTeam.argent) || 0;  

    await ovl.sendMessage(ms_org, {  
      image: { url: 'https://files.catbox.moe/s5pyu9.jpg' },  
      caption: `╭───〔 *⚽BOUTIQUE BLUE LOCK🔷* 〕

😃Bienvenue dans la boutique BLUE🔷LOCK ! 🛒🛍️🎁
Pour acheter ou vendre une carte :
⚽Achat: Isagi / ⚽vente: Isagi (NEL)
Ensuite attends la validation du système✅ !
pour fermer la session de boutique 👉🏽 close.

#Happy202️⃣6️⃣🎊🎄🎁
╰───────────────────
             *🔷BLUE LOCK🛍️ STORE*`
    }, { quoted: ms });

    const waitFor = async (timeout = 120000) => {  
      try {  
        const r = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: timeout });  
        return (r?.message?.extendedTextMessage?.text || r?.message?.conversation || "").trim();  
      } catch { return ""; }  
    };  

    let sessionOpen = true;  
    let userInput = await waitFor();  

    while (sessionOpen) {  
      if (!userInput) return repondre("❌ Temps écoulé. Session fermée.");  
      if (userInput.toLowerCase() === "close") { await repondre("✅ Boutique fermée."); break; }  

      const cleaned = userInput.replace(/[^a-zA-Z]/g, "").toLowerCase();  
      let mode = null;  
      if (cleaned.startsWith("achat")) mode = "achat";  
      else if (cleaned.startsWith("vente")) mode = "vente";  

      if (!mode) { userInput = await waitFor(); continue; }  

      const parts = userInput.split(":");  
      if (parts.length < 2) { userInput = await waitFor(); continue; }  

      let query = parts.slice(1).join(":").trim().toLowerCase();  
      if (!query) { await repondre("❌ Tu dois écrire un nom après ':'"); userInput = await waitFor(); continue; }  

      const q = query.replace(/[\s\-\_]/g, "");  
      let card = allCards.find(c => c.name.toLowerCase().replace(/[\s\-\_]/g, "") === q)  
              || allCards.find(c => c.name.toLowerCase().replace(/[\s\-\_]/g, "").includes(q));  

      if (!card) { await repondre(`❌ Aucune carte trouvée pour : ${query}`); userInput = await waitFor(); continue; }  

      const limite = rankLimits[card.rank];
      if (limite && (ficheTeam.niveau < limite.niveau || ficheTeam.goals < limite.goals)) {
        await repondre(`❌ Impossible d'acheter ${card.name} (Rank ${card.rank}) !  
Niveau requis : ${limite.niveau}▲ | Goals requis : ${limite.goals}  
Ton niveau : ${ficheTeam.niveau}▲ | Tes goals : ${ficheTeam.goals}`);
        userInput = await waitFor();
        continue;
      }

      const basePrix = card.price;  

      await ovl.sendMessage(ms_org, {  
        image: { url: card.image },  
        caption: `

╭───〔 🔷 BLUE LOCK CARD ⚽ 〕
🔹 Joueur : ${card.name}
🔹 Country : ${card.country}
🔹 Rank : ${card.rank}
🔹 OVR : ${card.ovr}
🔹 Taille : ${card.taille}
🔹 Pied : ${card.pieds}

💳 Prix : ${basePrix} 💶

Confirmer ${mode} ? (oui / non / +coupon)
╰───────────────────
                     *BLUE🔷LOCK⚽*`
      }, { quoted: ms });

      let conf = (await waitFor(60000)).toLowerCase();  
      if (conf.includes("non")) { await repondre("❌ Transaction annulée."); userInput = await waitFor(); continue; }  
      if (!conf.includes("oui") && !conf.includes("+coupon")) { await repondre("❌ Réponse invalide."); userInput = await waitFor(); continue; }  

      ficheTeam = await TeamFunctions.getUserData(auteur_Message);  
      ficheTeam.argent = Number(ficheTeam.argent) || 0;  
      userData = await MyNeoFunctions.getUserData(auteur_Message);  
      let np = userData.np || 0;  

      if (mode === "achat") {  
        let finalPrice = basePrix;  
        let couponUsed = false;  

        if (conf.includes("+coupon")) {  
          const coupons = userData.coupons || 0;  
          if (coupons < 100) { await repondre("❌ Pas assez de coupons !"); userInput = await waitFor(); continue; }  
          finalPrice = Math.floor(basePrix / 2);  
          couponUsed = true;  
          await MyNeoFunctions.updateUser(auteur_Message, { coupons: coupons - 100 });  
        }  

        if (np < 1) { await repondre("❌ Pas assez de NP !"); userInput = await waitFor(); continue; }  
        if (ficheTeam.argent < finalPrice) { await repondre(`❌ Pas assez d'argent ! 💶 Argent actuel : ${ficheTeam.argent} | Prix : ${finalPrice}`); userInput = await waitFor(); continue; }  

        await TeamFunctions.updateUser(auteur_Message, { argent: ficheTeam.argent - finalPrice });  
        await MyNeoFunctions.updateUser(auteur_Message, { np: np - 1 });  

        let cardsOwned = (userData.cards || "").split("\n").filter(Boolean);  
        if (!cardsOwned.includes(card.name)) cardsOwned.push(card.name);  
        await MyNeoFunctions.updateUser(auteur_Message, { cards: cardsOwned.join("\n") });  
        await MyNeoFunctions.updateUser(auteur_Message, { ns: (userData.ns + 5) });  

        await addToLineup(auteur_Message, card, ovl, ms_org, repondre);  

        await repondre(`

╭───〔 ⚽ REÇU D’ACHAT 🔷 〕──
🔥 ${card.name} ajouté !
💳 Paiement : 1 NP + ${finalPrice} 💶
${couponUsed ? "🎟️ Coupon utilisé (-50%)" : ""}
👑 +5 Royalities 🎉 ajoutés !

Merci pour l'achat ⚽🔷 !
╰───────────────────
                   *BLUE🔷LOCK⚽*`);
      }
      
//------------- VENTE (recherche tolérante) ------------
if (mode === "vente") {

  let cardsOwned = (userData.cards || "")
      .split("\n")
      .map(c => c.trim())
      .filter(Boolean);

  // fonctions de normalisation
  const norm = s => pureName(s).replace(/\s+/g, "");        // supprime espaces pour comparaison compacte
  const qNorm = norm(query);                                // query = ce que l'utilisateur a tapé (ex: "isagi")

  const idx = cardsOwned.findIndex(c => {
    const cNorm = norm(c);
    return cNorm === qNorm || cNorm.includes(qNorm) || qNorm.includes(cNorm);
  });

  if (idx === -1) {
      await repondre("❌ Tu ne possèdes pas cette carte !");
      userInput = await waitFor();
      continue;
  }

  // suppression de la carte possédée
  cardsOwned.splice(idx, 1);
  await MyNeoFunctions.updateUser(auteur_Message, { cards: cardsOwned.join("\n") });

  const salePrice = Math.floor(basePrix / 2);
  await TeamFunctions.updateUser(auteur_Message, { argent: ficheTeam.argent + salePrice });

  await repondre(`
╭───〔 ⚽ REÇU DE VENTE 🔷 〕──
🔹 Carte vendue : ${card.name}
💶 Gain : ${salePrice}
💰 Argent actuel : ${ficheTeam.argent + salePrice}
╰───────────────────
                  *BLUE🔷LOCK⚽*`);
}
      
      userInput = await waitFor();  
    }

  } catch (err) {  
    console.log("Erreur critique BL:", err);  
    return repondre("⚽Erreur inattendue. Tape `close` pour quitter.");  
  }

});

// --- SUBSTITUTION LINEUP ---
ovlcmd({
  nom_cmd: "sub",
  react: "🔁",
  classe: "NEO_GAMES⚽"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {
  try {
    let userData = await MyNeoFunctions.getUserData(auteur_Message);
    if (!userData) return repondre("❌ Impossible de récupérer tes données.");

    let ficheLineup = await getLineup(auteur_Message);
    if (!ficheLineup) return repondre("❌ Impossible de récupérer ton lineup.");
    ficheLineup = ficheLineup.toJSON ? ficheLineup.toJSON() : ficheLineup;

    const regex = /\+sub\s+(.+?)\s+par\s+(.+)/i;
    const match = ms?.message?.conversation?.match(regex);
    if (!match) return repondre("❌ Format invalide. Utilise : +sub [Joueur à remplacer] par [Nouvelle carte]");

    const ancienNom = match[1].trim();
    const nouveauNom = match[2].trim();

    let posAncien = null;
    for (let i = 1; i <= 15; i++) {
      const j = ficheLineup[`joueur${i}`] || "";
      if (pureName(j).includes(pureName(ancienNom))) {
        posAncien = i;
        break;
      }
    }
    if (!posAncien) return repondre(`❌ Aucun joueur trouvé avec le nom "${ancienNom}" dans ton lineup.`);

    const carte = allCards.find(c => pureName(c.name) === pureName(nouveauNom));
    if (!carte) return repondre(`❌ Carte introuvable : ${nouveauNom}`);

    const cardsOwned = (userData.cards || "").split("\n").filter(Boolean);
if (!cardsOwned.some(c => pureName(c) === pureName(carte.name))) 
    return repondre(`❌ Tu ne possèdes pas ${carte.name} pour la remplacer.`);
    
    ficheLineup[`joueur${posAncien}`] = `${carte.name} (${carte.ovr})${carte.countryEmoji || getCountryEmoji(carte.country)}`;
    await updatePlayers(auteur_Message, ficheLineup);

    await repondre(`✅ ${carte.name} a remplacé ${ancienNom} en position J${posAncien} ✔️`);

  } catch (err) {
    console.error("Erreur commande sub:", err);
    return repondre("❌ Erreur interne lors de la substitution.");
  }
});

// --- DELETE UN JOUEUR +DEL J# ---
ovlcmd({
  nom_cmd: "del",
  react: "❌",
  classe: "NEO_GAMES⚽"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {
  try {
    let ficheLineup = await getLineup(auteur_Message);
    if (!ficheLineup) return repondre("❌ Impossible de récupérer ton lineup.");
    ficheLineup = ficheLineup.toJSON ? ficheLineup.toJSON() : ficheLineup;

    const regex = /\+del\s+J(\d{1,2})/i;
    const match = ms?.message?.conversation?.match(regex);
    if (!match) return repondre("❌ Format invalide. Utilise : +del J2");

    const pos = parseInt(match[1], 10);
    if (pos < 1 || pos > 15) return repondre("❌ Position invalide (1-15).");

    ficheLineup[`joueur${pos}`] = "aucun";
    await updatePlayers(auteur_Message, ficheLineup);

    await repondre(`✅ Joueur en position J${pos} supprimé avec succès !`);
  } catch (err) {
    console.error("Erreur commande del:", err);
    return repondre("❌ Erreur interne lors de la suppression du joueur.");
  }
});
