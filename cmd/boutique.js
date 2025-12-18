const { ovlcmd } = require('../lib/ovlcmd');
const { cards } = require('../DataBase/cards');
const { MyNeoFunctions } = require("../DataBase/myneo_lineup_team");
const { getData, setfiche, getAllFiches } = require("../DataBase/allstars_divs_fiches");
const config = require("../set");

// --- UTILITAIRES ---
function getCurrencyIcon(currency) {
  if (currency === "nc") return "🔷";
  if (currency === "golds") return "🧭";
  return "";
}

const formatNumber = n => {
  try {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } catch {
    return n;
  }
};

async function getAdjustedPrice(cardName, basePrice) {
  const allFiches = await getAllFiches();
  let ownersCount = 0;

  for (const fiche of allFiches) {
    const cardsList = (fiche.cards || "")
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);

    if (cardsList.includes(cardName)) ownersCount++;
  }

  return ownersCount >= 2 ? Math.floor(basePrice * 1.5) : basePrice;
}

// --- COMMANDE BOUTIQUE ---
ovlcmd({
  nom_cmd: "boutique",
  react: "🛒",
  classe: "NEO_GAMES"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {

  try {
    let userData = await MyNeoFunctions.getUserData(auteur_Message);
    let fiche = await getData({ jid: auteur_Message });
    if (!userData || !fiche) return repondre("❌ Impossible de récupérer ta fiche.");

    // --- TEXTE D'ACCUEIL ---
    await ovl.sendMessage(ms_org, {
      image: { url: 'https://files.catbox.moe/i87tdr.png' },
      caption: `╭────〔 *🛍️BOUTIQUE🛒* 〕     
😃Bienvenue dans la boutique NEO🛍️Store🛒, pour faire un achat il vous suffit de taper comme ceci : 🛍️achat: sasuke(Hebi)/ 🛍️vente: sasuke(Hebi). Après cela attendez la validation de votre achat ou de votre vente. #Happy202️⃣6️⃣🎊🎄
╰─────────────────── *🔷NEO🛍️STORE*`
    }, { quoted: ms });

    const waitFor = async (timeout = 120000) => {
      const r = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: timeout });
      const txt = r?.message?.extendedTextMessage?.text || r?.message?.conversation || "";
      return txt ? txt.trim() : "";
    };

    const allCards = [];
    for (const [placementKey, placementCards] of Object.entries(cards)) {
      for (const c of placementCards) {
        allCards.push({ ...c, placement: placementKey });
      }
    }

    let userInput = await waitFor();
    if (!userInput) return repondre("❌ Temps écoulé. Session fermée.");

    while (true) {
      try {
        fiche = await getData({ jid: auteur_Message });
        userData = await MyNeoFunctions.getUserData(auteur_Message });

        if (userInput.toLowerCase() === "close") {
          await repondre("✅ Boutique fermée.");
          break;
        }

        const cleanedInput = userInput.replace(/[^a-zA-Z]/g, "").toLowerCase();
        let mode = null;
        if (cleanedInput.startsWith("vente")) mode = "vente";
        if (cleanedInput.startsWith("achat")) mode = "achat";
        if (!mode) {
          userInput = await waitFor();
          continue;
        }

        const parts = userInput.split(":");
        if (parts.length < 2) {
          userInput = await waitFor();
          continue;
        }

        const query = parts.slice(1).join(":").trim();
        if (!query) {
          await repondre("❌ Tu dois écrire un nom après ':'");
          userInput = await waitFor();
          continue;
        }

        const q = query.toLowerCase().replace(/[\s\-_]/g, "");
        const card = allCards.find(c =>
          c.name.toLowerCase().replace(/[\s\-_]/g, "") === q ||
          c.name.toLowerCase().includes(query.toLowerCase())
        );

        if (!card) {
          await repondre(`❌ Aucune carte trouvée pour : ${query}`);
          userInput = await waitFor();
          continue;
        }

        const basePrix = parseInt((card.price || "").replace(/[^\d]/g, "")) || 0;
        const golds = parseInt(fiche.golds || 0);
        const nc = parseInt(userData.nc || 0);

        // ---------------- ACHAT ----------------
        if (mode === "achat") {

          const userLevel = parseInt(fiche.niveu_xp || 0);
          const cardGrade = (card.grade || "").toUpperCase();

          if (["SS-", "SS", "SS+"].includes(cardGrade) && userLevel < 10) {
            await repondre(`❌ Niveau insuffisant pour acheter cette carte (niveau requis : 10▲). Ton niveau : ${userLevel}▲
╰───────────────────`);
            userInput = await waitFor();
            continue;
          }

          if (cardGrade === "OR" && userLevel < 5) {
            await repondre(`❌ Niveau insuffisant pour acheter cette carte OR (niveau requis : 5▲). Ton niveau : ${userLevel}▲
╰───────────────────`);
            userInput = await waitFor();
            continue;
          }

          const icon = getCurrencyIcon(card.currency);

          await ovl.sendMessage(ms_org, {
            image: { url: card.image },
            caption: `🌀🎴 Carte: ${card.name}   
🔅Grade: ${card.grade}
🔅Catégorie: ${card.category}
🔅Placement: ${card.placement}
🛍️Prix: ${card.price} ${icon}

✔️ Confirmer achat ? (oui/non/+coupon)
╰──────────────────`
          }, { quoted: ms });

          const conf = (await waitFor(60000)).toLowerCase();
          if (!conf.includes("oui")) {
            await repondre("❌ Réponse invalide.");
            userInput = await waitFor();
            continue;
          }

          let finalPrice = await getAdjustedPrice(card.name, basePrix);

          if (card.currency === "golds" && golds < finalPrice) {
            await repondre("❌ Pas assez de fonds");
            userInput = await waitFor();
            continue;
          }

          if (card.currency === "nc" && nc < finalPrice) {
            await repondre("❌ Pas assez de fonds");
            userInput = await waitFor();
            continue;
          }

          await MyNeoFunctions.updateUser(auteur_Message, { np: (userData.np || 0) - 1 });

          if (card.currency === "golds")
            await setfiche("golds", golds - finalPrice, auteur_Message);
          else
            await MyNeoFunctions.updateUser(auteur_Message, { nc: nc - finalPrice });

          const cardsList = (fiche.cards || "").split("\n").filter(Boolean);
          if (!cardsList.includes(card.name)) cardsList.push(card.name);
          await setfiche("cards", cardsList.join("\n"), auteur_Message);

          await MyNeoFunctions.updateUser(auteur_Message, { ns: (userData.ns || 0) + 5 });

          await ovl.sendMessage(ms_org, {
            image: { url: card.image },
            caption: `╭───〔 🌀🛍️ REÇU D’ACHAT 〕─     
👤 Client: ${fiche.code_fiche}
🎴 Carte ajoutée: ${card.name}
💳 Paiement: 1 NP + ${formatNumber(finalPrice)} ${icon}
👑 +5 NS ajouté ! Royalities xp 👑🎉🍾🥂

Merci pour ton achat !
╰───────────────────`
          }, { quoted: ms });
        }

        userInput = await waitFor();

      } catch (err) {
        console.log("Erreur session boutique:", err);
        await repondre("🛍️Boutique en attente… tape `close` pour fermer.");
        userInput = await waitFor();
      }
    }

  } catch (e) {
    console.log("Erreur boutique critique:", e);
    repondre("🛍️Boutique en attente… tape \"close\" pour fermer.");
  }
});
