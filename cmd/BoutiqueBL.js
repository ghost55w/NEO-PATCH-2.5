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
  try { 
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); 
  } catch (e) { 
    return n; 
  }
};

// --- NOM PUR pour comparaison ---
const pureName = str => {
  if (!str) return "";
  let s = String(str);
  s = s.replace(/.+?/g, " ");
  s = s.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, " ");
  s = s.replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, " ");
  s = s.replace(/[\uFE00-\uFE0F\u200D]/g, " ");
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[^0-9a-zA-ZÀ-ÿ\s]/g, " ");
  s = s.replace(/\s+/g, " ").trim().toLowerCase();
  return s;
};
const compact = s => pureName(s).replace(/\s+/g, "");

// --- EMOJI PAYS ---
const countryEmojis = {
  "Japan": "\u{1F1EF}\u{1F1F5}",//🇯🇵
  "France": "\u{1F1EB}\u{1F1F7}",//🇫🇷
  "Brazil": "\u{1F1E7}\u{1F1F7}",//🇧🇷
  "Germany": "\u{1F1E9}\u{1F1EA}",//🇩🇪
  "Malta": "\u{1F1F2}\u{1F1F9}", //🇲🇹
  "England": "\u{1F1EC}\u{1F1E7}", // 🇬🇧 
  "Argentina": "\u{1F1E6}\u{1F1F7}", // 🇦🇷
  "Spain": "\u{1F1EA}\u{1F1F8}", // 🇪🇸
  "Nigeria": "\u{1F1F3}\u{1F1EC}", // 🇳🇬
  "Italy": "\u{1F1EE}\u{1F1F9}", // 🇮🇹
};
const getCountryEmoji = country => countryEmojis[country] || "";

// --- RANK LIMITS ---
const rankLimits = {
  "SS": { niveau: 10, goals: 30 },
  "S": { niveau: 5, goals: 15 },
  "A": { niveau: 3, goals: 5 }
};

// --- CALCUL DU PRIX ---
function calculPrix(card) {
  let baseRankPrice = {
    "S": 1000000,
    "SS": 3000000
  }[card.rank] || 100000;

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
      } catch (e) { return ""; }
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

  } catch (e) {
    console.error("❌ Erreur addToLineup:", e);
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
      } catch (e) { return ""; }
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
Ton niveau : ${ficheTeam.niveau}▲ | Tes goals : ${ficheTeam.goals}
╰───────────────────
                *BLUE🔷LOCK⚽*`);
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
      } else if (mode === "vente") {
        // --- VENTE ---
        let ficheLineup = await getLineup(auteur_Message);
        ficheLineup = ficheLineup?.toJSON ? ficheLineup.toJSON() : ficheLineup;

        let cardsOwned = (userData.cards || "").split("\n").map(c => c.trim()).filter(Boolean);
        const qNorm = pureName(query);
        const ownedNormalized = cardsOwned.map(c => pureName(c));

        let lineupSlots = [];
        for (let i = 1; i <= 15; i++) {
          const raw = ficheLineup?.[`joueur${i}`] || "";
          if (raw && raw !== "aucun") {
            lineupSlots.push({ pos: i, raw, norm: pureName(raw.replace(/\d+/g, " ").replace(/[\u{1F1E6}-\u{1F1FF}]/gu, " ")) });
          }
        }

        let idx = ownedNormalized.findIndex(n => n === qNorm);
        if (idx === -1) idx = ownedNormalized.findIndex(n => n.includes(qNorm) || qNorm.includes(n));
        if (idx === -1) {
          const p = qNorm.split(" ");
          idx = ownedNormalized.findIndex(n => {
            const np = n.split(" ");
            return p.some(x => np.includes(x));
          });
        }

        let lineupMatch = null;
        if (idx === -1) {
          lineupMatch = lineupSlots.find(s => s.norm === qNorm);
          if (!lineupMatch) lineupMatch = lineupSlots.find(s => s.norm.includes(qNorm) || qNorm.includes(s.norm));
        }

        if (idx === -1 && !lineupMatch) {
          await repondre("❌ Tu ne possèdes pas cette carte !");
          userInput = await waitFor();
          continue;
        }

        if (idx !== -1) {
          cardsOwned.splice(idx, 1);
          await MyNeoFunctions.updateUser(auteur_Message, { cards: cardsOwned.join("\n") });
        }

        if (lineupMatch) {
          ficheLineup[`joueur${lineupMatch.pos}`] = "aucun";
          await updatePlayers(auteur_Message, ficheLineup);
        }

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
    } // end while
  } catch (e) {
    console.log("Erreur critique BL:", e);
    return repondre("⚽Erreur inattendue. Tape `close` pour quitter.");
  }
});


// --- LINEUP DIRECT +lineup⚽ jX = Nom ---
ovlcmd({
  nom_cmd: "lineup⚽",
  react: "⚽",
  classe: "NEO_GAMES⚽"
}, async (ms_org, ovl, { ms, auteur_Message, arg, repondre }) => {
  try {
    // 🎬 GIF AVANT TOUT (affichage OU modification)
if (!arg || arg.length <= 1) {
  await ovl.sendMessage(ms_org, {
    video: { url: "https://files.catbox.moe/z64kuq.mp4" },
    caption: "",
    gifPlayback: true
  }, { quoted: ms });
}
    // 📋 AFFICHAGE SIMPLE DU LINEUP
if (!arg || arg.length === 0) {
  let data = await getLineup(auteur_Message);
  if (!data) return repondre("❌ Impossible de récupérer ton lineup.");
  data = data.toJSON ? data.toJSON() : data;

  const lineup = `░░ *👥SQUAD⚽🥅*: ${data.nom || "Neo"}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▱
1  👤(AG) ${data.joueur1 || "aucun"} 
2  👤(AC) ${data.joueur2 || "aucun"} 
3  👤(AD) ${data.joueur3 || "aucun"} 
4  👤(MG) ${data.joueur4 || "aucun"} 
5  👤(MC) ${data.joueur5 || "aucun"} 
6  👤(MD) ${data.joueur6 || "aucun"} 
7  👤(DG) ${data.joueur7 || "aucun"}  
8  👤(DC) ${data.joueur8 || "aucun"} 
9  👤(DC) ${data.joueur9 || "aucun"}  
10 👤(DD) ${data.joueur10 || "aucun"}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▱
*🔷BENCH🥅*:
11 👤${data.joueur11 || "aucun"}
12 👤${data.joueur12 || "aucun"}
13 👤${data.joueur13 || "aucun"}
14 👤${data.joueur14 || "aucun"}
15 👤${data.joueur15 || "aucun"}
╰───────────────────
                    *BLUE🔷LOCK⚽*`;

  await ovl.sendMessage(ms_org, {
    image: { url: "https://files.catbox.moe/p94q3m.jpg" },
    caption: lineup
  }, { quoted: ms });

  return;
}
// ⚠️ FORMAT INVALIDE (MODIFICATION)
if (arg.length < 3)
  return repondre("⚠️ Format : +lineup⚽ j2 = Kuon");
    let ficheLineup = await getLineup(auteur_Message);
    if (!ficheLineup) return repondre("❌ Impossible de récupérer ton lineup.");
    ficheLineup = ficheLineup.toJSON ? ficheLineup.toJSON() : ficheLineup;

    const updates = {};
    let pendingPlacement = null;

    for (let i = 0; i < arg.length; i += 3) {
      if (!/^j\d+$/i.test(arg[i]) || arg[i + 1] !== "=") continue;

      let pos = parseInt(arg[i].slice(1), 10);
      if (pos < 1 || pos > 15) continue;

      const inputName = arg[i + 2];

      // 🔍 Recherche joueur DB
      const input = pureName(inputName);
      const wantsNEL = /nel/i.test(inputName);
      const players = Object.values(cardsBlueLock);

      let found = players.filter(p => pureName(p.name) === input);
      if (!found.length) {
        found = players.filter(p => {
          const pn = pureName(p.name);
          if (!pn.includes(input)) return false;
          if (!wantsNEL && /nel/i.test(p.name)) return false;
          return true;
        });
      }

      if (!found.length)
        return repondre(`❌ Joueur introuvable : ${inputName}`);

      found.sort((a, b) => b.ovr - a.ovr);
      const p = found[0];
      const formatted = `${p.name} (${p.ovr}) ${getCountryEmoji(p.country)}`;

      // ⚠️ Position occupée
      if (ficheLineup[`joueur${pos}`] && ficheLineup[`joueur${pos}`] !== "aucun") {
        pendingPlacement = { player: formatted, wanted: pos };
      } else {
        updates[`joueur${pos}`] = formatted;
      }
    }

    // 🔁 Demande position libre
    if (pendingPlacement) {
      const free = [];
      for (let i = 1; i <= 15; i++) {
        if (!ficheLineup[`joueur${i}`] || ficheLineup[`joueur${i}`] === "aucun") {
          free.push(i);
        }
      }

      if (!free.length)
        return repondre("❌ Ton lineup est plein.");

      await repondre(
        `⚠️ Position J${pendingPlacement.wanted} occupée.\n` +
        `Choisis une position libre pour ${pendingPlacement.player} :\n` +
        free.map(i => `J${i}`).join(", ")
      );

      const waitFor = async (timeout = 60000) => {
        try {
          const r = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: timeout });
          return (r?.message?.conversation || "").trim();
        } catch { return ""; }
      };

      const reply = await waitFor();
      const match = reply.match(/j(\d+)/i);
      const newPos = match ? parseInt(match[1], 10) : null;

      if (!newPos || !free.includes(newPos))
        return repondre("❌ Position invalide.");

      updates[`joueur${newPos}`] = pendingPlacement.player;
    }

    if (!Object.keys(updates).length)
      return repondre("⚠️ Aucun changement effectué.");

    if (!Object.keys(updates).length)
  return repondre("⚠️ Aucun changement effectué.");

await updatePlayers(auteur_Message, updates);

// ✅ MESSAGE DE CONFIRMATION
await repondre(
  "✅ Joueur(s) ajouté(s) avec succès ⚽\n" +
  Object.entries(updates)
    .map(([k, v]) => `• ${k.replace("joueur", "J")} → ${v}`)
    .join("\n")
);

  } catch (e) {
    console.error("❌ LINEUP ERROR:", e);
    return repondre(`❌ Erreur LINEUP\n${e.message}`);
  }
});

// --- SUBSTITUTION / ÉCHANGE +sub⚽ ---
ovlcmd({
  nom_cmd: "sub⚽",
  react: "🔁",
  classe: "NEO_GAMES⚽"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {
  try {
    let ficheLineup = await getLineup(auteur_Message);
    if (!ficheLineup) return repondre("❌ Impossible de récupérer ton lineup.");
    ficheLineup = ficheLineup.toJSON ? ficheLineup.toJSON() : ficheLineup;

    const text =
      ms?.message?.conversation ||
      ms?.message?.extendedTextMessage?.text ||
      "";

    const match = text.match(/\+sub⚽\s+(.+?)\s+par\s+(.+)/i);
    if (!match)
      return repondre("⚠️ Format : +sub⚽ Nagi par Isagi");

    const nameA = match[1].trim();
    const nameB = match[2].trim();

    const normA = pureName(nameA);
    const normB = pureName(nameB);

    let posA = null, posB = null;

    // 🔍 Recherche des deux joueurs DANS le lineup
    for (let i = 1; i <= 15; i++) {
      const slot = ficheLineup[`joueur${i}`];
      if (!slot || slot === "aucun") continue;

      const slotNorm = pureName(slot);

      if (posA === null && slotNorm.includes(normA)) posA = i;
      if (posB === null && slotNorm.includes(normB)) posB = i;
    }

    if (!posA)
      return repondre(`❌ Joueur introuvable dans le lineup : ${nameA}`);
    if (!posB)
      return repondre(`❌ Joueur introuvable dans le lineup : ${nameB}`);

    if (posA === posB)
      return repondre("⚠️ Les deux joueurs sont déjà à la même position.");

    // 🔁 ÉCHANGE
    const temp = ficheLineup[`joueur${posA}`];
    ficheLineup[`joueur${posA}`] = ficheLineup[`joueur${posB}`];
    ficheLineup[`joueur${posB}`] = temp;

    await updatePlayers(auteur_Message, ficheLineup);

    return repondre(
      `🔁 Substitution réussie ⚽\n` +
      `• J${posA} ↔ J${posB}\n` +
      `• ${ficheLineup[`joueur${posA}`]} ⇄ ${ficheLineup[`joueur${posB}`]}`
    );

  } catch (e) {
    console.error("❌ SUB⚽ ERROR:", e);
    return repondre("❌ Erreur interne lors de la substitution.");
  }
});


// --- DELETE UN JOUEUR +DEL J# ---
ovlcmd({
  nom_cmd: "del",
  react: "❌",
  classe: "NEO_GAMES⚽"
}, async (ms_org, ovl, { ms, auteur_Message, arg, repondre }) => {
  try {
    let ficheLineup = await getLineup(auteur_Message);
    if (!ficheLineup) return repondre("❌ Impossible de récupérer ton lineup.");
    ficheLineup = ficheLineup.toJSON ? ficheLineup.toJSON() : ficheLineup;

    if (!arg || !arg.length)
      return repondre("❌ Utilise : +del j1 j2 j3");

    const deleted = [];

    for (const a of arg) {
      const m = a.match(/^j(\d{1,2})$/i);
      if (!m) continue;
      const pos = parseInt(m[1], 10);
      if (pos < 1 || pos > 15) continue;

      if (ficheLineup[`joueur${pos}`] && ficheLineup[`joueur${pos}`] !== "aucun") {
        ficheLineup[`joueur${pos}`] = "aucun";
        deleted.push(`J${pos}`);
      }
    }

    if (!deleted.length)
      return repondre("⚠️ Aucun joueur supprimé.");

    await updatePlayers(auteur_Message, ficheLineup);

    return repondre(
      "✅ Joueur(s) supprimé(s) avec succès ❌\n" +
      deleted.join(", ")
    );

  } catch (e) {
    console.error("Erreur commande del:", e);
    return repondre("❌ Erreur interne lors de la suppression.");
  }
});

// --- COMMANDE TIRAGE BLUE LOCK ---
ovlcmd({
  nom_cmd: "tirageBL",
  react: "🎲",
  classe: "BLUE_LOCK🔷",
  desc: "Lance un tirage Blue Lock (Deluxe, Super ou Ultra)"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {
  console.log("🟢 [TIRAGEBL-0] Commande détectée");

  try {
    console.log("🟢 [TIRAGEBL-1] Auteur :", auteur_Message);
    const ficheNeo = await MyNeoFunctions.getUserData(auteur_Message);
    if (!ficheNeo) return repondre(`❌ Aucun joueur trouvé avec l'id : ${auteur_Message}`);

    let lineup = ficheNeo.lineup || Array(15).fill(null);

    // --- GIF initial ---
    const gifTirage = "https://files.catbox.moe/jgwato.mp4";
    await ovl.sendMessage(ms_org, { video: { url: gifTirage }, caption: "", gifPlayback: true }, { quoted: ms });

    // --- 3 images des tirages ---
    const tiragesAffichage = [
      { type: "Deluxe", nc: 30, image: "https://files.catbox.moe/2bszsx.jpg", caption: "💠 Tirage Deluxe - 30 NC 🔷\nProbabilités: B 85%, A 60% (>=5 buts)" },
      { type: "Super", nc: 50, image: "https://files.catbox.moe/4ekp2h.jpg", caption: "💎 Tirage Super - 50 NC 🔷\nProbabilités: A 80%, S 50% (>=10 buts, niv10, OVR>=95 10%)" },
      { type: "Ultra", nc: 70, image: "https://files.catbox.moe/s1jdub.png", caption: "🏆 Tirage Ultra - 70 NC 🔷\nProbabilités: A 80%, S 65% (>=10 buts, niv10, OVR>=95 20%), SS 30% (>=20 buts, niv20, OVR>=105 10%)" },
    ];
    for (const t of tiragesAffichage) {
      await ovl.sendMessage(ms_org, { image: { url: t.image }, caption: t.caption }, { quoted: ms });
    }

    await repondre("⚠️ Choisis ton tirage : *Deluxe*, *Super* ou *Ultra*");

    // --- Demande type tirage ---
    const demanderType = async (tentative = 1) => {
      if (tentative > 3) throw new Error("MaxAttempts");
      const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
      const texte = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation || "";
      const r = texte.toLowerCase();
      if (["deluxe","super","ultra"].includes(r)) return r;
      await repondre("⚠️ Choix invalide. Réponds par *Deluxe*, *Super* ou *Ultra*.");
      return demanderType(tentative + 1);
    };
    const typeTirage = await demanderType();
    const ncTirage = tiragesAffichage.find(t => t.type.toLowerCase() === typeTirage).nc;
    if ((ficheNeo.nc || 0) < ncTirage) return repondre(`❌ Pas assez de NC 🔷 (il te faut ${ncTirage})`);

    // --- Débit NC + NS royalities ---
    await MyNeoFunctions.updateUser(auteur_Message, {
      nc: ficheNeo.nc - ncTirage,
      ns: (ficheNeo.ns || 0) + 5
    });

    // --- Fonction tirage avec probabilités ---
    function tirerCarte(type) {
      const cartes = Object.values(cardsBlueLock);
      let filtres = cartes.filter(c => {
        if (type === "deluxe") {
          if (c.rank === "B") return Math.random() <= 0.85;
          if (c.rank === "A") return (ficheNeo.buts >= 5) && Math.random() <= 0.60;
        }
        if (type === "super") {
          if (c.rank === "A") return Math.random() <= 0.80;
          if (c.rank === "S") return (ficheNeo.buts >= 10 && ficheNeo.niveau >= 10) && (c.ovr >= 95 ? Math.random() <= 0.10 : Math.random() <= 0.50);
        }
        if (type === "ultra") {
          if (c.rank === "A") return Math.random() <= 0.80;
          if (c.rank === "S") return (ficheNeo.buts >= 10 && ficheNeo.niveau >= 10) && (c.ovr >= 95 ? Math.random() <= 0.20 : Math.random() <= 0.65);
          if (c.rank === "SS") return (ficheNeo.buts >= 20 && ficheNeo.niveau >= 20) && (c.ovr >= 105 ? Math.random() <= 0.10 : Math.random() <= 0.30);
        }
        return false;
      });
      if (filtres.length === 0) filtres = cartes;
      return filtres[Math.floor(Math.random() * filtres.length)];
    }

    const cartesTirees = [tirerCarte(typeTirage), tirerCarte(typeTirage)];

    // --- GIF tirage avec compteur simplifié (5 étapes seulement) ---
    await ovl.sendMessage(ms_org, { video: { url: gifTirage }, caption: "⚽🔷 Tirage encore... 0%" }, { quoted: ms });
    for (let i = 1; i <= 5; i++) {
      await ovl.sendMessage(ms_org, { text: `⚽🔷 Tirage encore... ${i*20}%` });
      await new Promise(res => setTimeout(res, 150)); // 150ms par étape = effet rapide
    }

    // --- Envoi cartes tirées ---
    for (let carte of cartesTirees) {
      await ovl.sendMessage(ms_org, {
        image: { url: carte.image },
        caption: `
╭───〔 🔷 BLUE LOCK CARD ⚽ 〕
🔹 Joueur : ${carte.name}
🔹 Country : ${carte.country}
🔹 Rank : ${carte.rank}
🔹 OVR : ${carte.ovr}
🔹 Taille : ${carte.taille}
🔹 Pied : ${carte.pieds}
╰───────────────────
*BLUE🔷LOCK⚽*`
      }, { quoted: ms });

      // Placement automatique dans la première position libre
      let pos = lineup.findIndex(p => !p);
      if (pos !== -1) lineup[pos] = `${carte.name} (${carte.ovr}) ${getCountryEmoji(carte.country)}`;
    }

    await MyNeoFunctions.updateUser(auteur_Message, { lineup });
    return repondre("✅ Tirage terminé et toutes les cartes placées avec succès ! ⚽🔷");

  } catch (e) {
    console.error("🔴 [TIRAGEBL-FATAL]", e);
    return repondre("❌ Erreur lors du tirage : " + e.message);
  }
});
