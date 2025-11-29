const { ovlcmd } = require('../lib/ovlcmd');
const { cards } = require('../DataBase/cards');
const { MyNeoFunctions } = require("../DataBase/myneo_lineup_team");
const { getData, setfiche } = require("../DataBase/allstars_divs_fiches");
const config = require("../set");

ovlcmd({
    nom_cmd: "boutique🛍️",
    react: "🛒",
    classe: "NEO_GAMES🎰"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {

    try {
        const userData = await MyNeoFunctions.getUserData(auteur_Message);
        const fiche = await getData({ jid: auteur_Message });

        if (!userData || !fiche)
            return repondre("❌ Impossible de récupérer ta fiche.");

        // MENU SIMPLIFIÉ
        await ovl.sendMessage(ms_org, {
            image: { url: 'https://files.catbox.moe/ye33nv.png' },
            caption: `╭────〔 🛍️ BOUTIQUE NEO🛒 〕
Bienvenue dans la boutique.

Tu as 2 minutes pour écrire le nom d’une carte.
*#Happy202️⃣6️⃣🎊🎄*
╰───────────────────
                  *🔷NEO🛍️STORE*`
        }, { quoted: ms });

        // RÉCUPERER NOM DE LA CARTE
        const rep1 = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 120000 });
        const texte1 = rep1.message?.extendedTextMessage?.text || rep1.message?.conversation || "";
        const searchName = texte1.toLowerCase().trim();

        if (!searchName) return repondre("❌ Aucun nom reçu.");

        // Rechercher les cartes
        let found = [];
        for (const placement of Object.values(cards)) {
            for (const c of placement) {
                if (c.name.toLowerCase().includes(searchName)) {
                    found.push(c);
                }
            }
        }

        if (found.length === 0)
            return repondre(`❌ Aucune carte trouvée pour : ${searchName}`);

        // Liste des cartes
        let list = "📋 *Cartes trouvées :*\n\n";
        found.forEach((c, i) => {
            list += `${i + 1}. ${c.name} — Grade: ${c.grade} — Catégorie: ${c.category} — Prix: ${c.price}\n`;
        });

        await repondre(list + "\n🕒 Choisis un numéro (5 minutes)");

        // Récup numéro
        const rep2 = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 300000 });
        const texte2 = rep2.message?.extendedTextMessage?.text || rep2.message?.conversation || "";
        const choix = parseInt(texte2.trim());

        if (isNaN(choix) || choix < 1 || choix > found.length)
            return repondre("❌ Numéro invalide.");

        const card = found[choix - 1];

        // FICHE DE LA CARTE
        await ovl.sendMessage(ms_org, {
            image: { url: card.image },
            caption: `🎴 *Carte sélectionnée :*

Nom : ${card.name}
Grade : ${card.grade}
Catégorie : ${card.category}
Placement : ${card.placement}
Prix : ${card.price}

✔️ Confirmer l'achat ? (oui / non)`
        }, { quoted: ms });

        // CONFIRMATION
        const rep3 = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 120000 });
        const texte3 = rep3.message?.extendedTextMessage?.text || rep3.message?.conversation || "";
        const r3 = texte3.toLowerCase().trim();

        if (!["oui", "yes", "y"].includes(r3))
            return repondre("❌ Achat annulé.");

        // CALCUL DU PRIX
        let prix = parseInt(card.price.replace(/[^\d]/g, ""));

        // Vérif NP
        let np = parseInt(userData.np);
        if (np < 1) return repondre("❌ Tu n’as pas assez de NP.");
        await MyNeoFunctions.updateUser(auteur_Message, { np: np - 1 });

        // Vérif monnaie
        if (card.price.includes("🧭")) {
            let golds = parseInt(fiche.golds);
            if (golds < prix) return repondre("❌ Pas assez de G🧭.");
            await setfiche("golds", golds - prix, auteur_Message);
        }

        if (card.price.includes("🔷")) {
            let nc = parseInt(userData.nc);
            if (nc < prix) return repondre("❌ Pas assez de NC.");
            await MyNeoFunctions.updateUser(auteur_Message, { nc: nc - prix });
        }

        // AJOUTER AUTOMATIQUEMENT LA CARTE DANS LA FICHE
        let currentCards = fiche.cards || "";
        let listCards = currentCards.split("\n").filter(x => x.trim() !== "");

        // Vérification limite
        if (listCards.length >= config.CARDS_NOMBRE)
            return repondre(`❌ Limite atteinte (${config.CARDS_NOMBRE} cartes max).`);

        if (!listCards.includes(card.name))
            listCards.push(card.name);

        await setfiche("cards", listCards.join("\n"), auteur_Message);

        // REÇU FINAL
        const facture = `
╭───〔 🛍️ *REÇU D’ACHAT* 〕───────
👤 Client : ${fiche.code_fiche}

🎴 *${card.name}* ajoutée à ta fiche.

💳 Paiement :
• 1 NP
• ${prix} ${card.price.includes("🔷") ? "🔷" : "🧭"}

Merci pour ton achat !
╰───────────────────`;

        return ovl.sendMessage(ms_org, {
            image: { url: card.image },
            caption: facture
        }, { quoted: ms });

    } catch (e) {
        console.log(e);
        repondre("❌ Une erreur est survenue dans la boutique.");
    }
});
