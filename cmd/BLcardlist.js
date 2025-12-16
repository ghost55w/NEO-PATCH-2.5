const { ovlcmd } = require("../lib/ovlcmd");
const path = require("path");
const { groupedCards } = require(
  path.join(__dirname, "../DataBase/cardsBL")
);

const formatNumber = n => {
  try { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  catch { return n; }
};

const normalize = str =>
  (str || "").toLowerCase().replace(/[\s\-\_\(\)]/g, "");

ovlcmd({
  nom_cmd: "cardsbl",
  react: "🔷",
  classe: "NEO_GAMES"
}, async (ms_org, ovl, { auteur_Message, repondre }) => {
  try {

    await repondre(
      "⚽🔷📂 Veuillez mentionner le nom du joueur Blue Lock, ex : *⚽Isagi / 🔷Rin NEL*\nTapez `close` pour fermer la session.\n╰───────────────────"
    );

    // 🔵 Aplatir toutes les cards
    const allCards = [];
    for (const [placementKey, placementCards] of Object.entries(groupedCards)) {
      for (const c of placementCards) {
        allCards.push({ ...c, placement: placementKey });
      }
    }

    const startTime = Date.now();
    const timeout = 60000;

    while (Date.now() - startTime < timeout) {

      const reply = await ovl.recup_msg({
        auteur: auteur_Message,
        ms_org,
        temps: timeout - (Date.now() - startTime)
      });

      if (!reply || !reply.message) break;

      const body =
        reply.message.extendedTextMessage?.text ||
        reply.message.conversation ||
        reply.body ||
        "";

      if (!body) continue;

      // ❌ fermeture session
      if (body.trim().toLowerCase() === "close") {
        await repondre("✅ Session Blue Lock fermée.");
        break;
      }

      // 🔷 nettoyage input
      let txt = body.replace(/^🔷\s*/i, "").trim();
      if (!txt) continue;

      const q = normalize(txt);

      // 🔍 recherche intelligente
      let card =
        allCards.find(c => normalize(c.name) === q) ||
        allCards.find(c => normalize(c.name).startsWith(q)) ||
        allCards.find(c => normalize(c.name).includes(q));

      if (card) {
        await ovl.sendMessage(ms_org, {
          image: { url: card.image },
          caption:
`🔷⚽ *BLUE LOCK CARD*

Nom : ${card.name}
Country : ${card.country}
Rang : ${card.rank}
OVR : ${card.ovr}
Catégorie : ${card.category}
Placement : ${card.placement}
Prix : ${formatNumber(card.price)} 💶

╰───────────────────
                      *🔷BLUELOCK⚽*`
        }, { quoted: reply });

        continue;
      }

      // 🔵 suggestions sur le perso
      const perso = txt.split(/[\s\(\)]/)[0];
      const suggestions = allCards.filter(c =>
        normalize(c.name).includes(normalize(perso))
      );

      if (!suggestions.length) {
        await repondre("❌ *Aucune carte trouvée et aucune suggestion disponible.*");
        continue;
      }

      let msg = "╭────〔 *🔷⚽ LISTE BLUE LOCK 📂* 〕\n\n";
      msg += "🔷📋 *Nom non reconnu*\n";
      msg += "*Voici les cartes disponibles :*\n";
      suggestions.forEach((c, i) => {
        msg += `${i + 1}. ${c.name} - Rang ${c.rank} (OVR ${c.ovr})\n`;
      });
      msg += "╰───────────────────";

      await repondre(msg);

      const choiceReply = await ovl.recup_msg({
        auteur: auteur_Message,
        ms_org,
        temps: timeout - (Date.now() - startTime)
      });

      const choiceBody =
        choiceReply?.message?.extendedTextMessage?.text ||
        choiceReply?.message?.conversation ||
        "";

      if (!choiceBody) continue;

      if (choiceBody.trim().toLowerCase() === "close") {
        await repondre("✅ Session Blue Lock fermée.");
        break;
      }

      const choix = parseInt(choiceBody.trim());
      if (isNaN(choix) || choix < 1 || choix > suggestions.length) continue;

      const chosenCard = suggestions[choix - 1];

      await ovl.sendMessage(ms_org, {
        image: { url: chosenCard.image },
        caption:
`🔷⚽ *BLUE LOCK CARD*

Nom : ${chosenCard.name}
Rang : ${chosenCard.rank}
OVR : ${chosenCard.ovr}
Catégorie : ${chosenCard.category}
Placement : ${chosenCard.placement}
Prix : ${formatNumber(chosenCard.price)} 💶`
      }, { quoted: choiceReply });

    }

  } catch (err) {
    console.log("CARDS BL ERROR:", err);
    return;
  }
});
