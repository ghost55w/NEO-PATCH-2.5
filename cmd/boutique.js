const { ovlcmd } = require('../lib/ovlcmd');
const { cards } = require('../DataBase/cards');
const { MyNeoFunctions } = require("../DataBase/myneo_lineup_team");
const { getData, setfiche, getAllFiches } = require("../DataBase/allstars_divs_fiches");

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

        // 1 — Message d'accueil
        await ovl.sendMessage(ms_org, {
            image: { url: 'https://files.catbox.moe/ye33nv.png' },
            caption: `╭────〔 🛍️ BOUTIQUE NEO🛒 〕
Bienvenue dans la boutique.

Tu as 2 minutes pour écrire le nom d’une carte.
*#Happy202️⃣6️⃣🎊🎄*
╰───────────────────
                  *🔷NEO🛍️STORE*`
        }, { quoted: ms });

        // 2 — Attente nom (2 min)
        const rep1 = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 120000 });
        const texte1 = rep1.message?.extendedTextMessage?.text || rep1.message?.conversation || "";
        const searchName = texte1.toLowerCase().trim();

        if (!searchName) return repondre("❌ Aucun nom reçu.");

        // 3 — Recherche des cartes
        let found = [];
        for (const placement of Object.values(cards)) {
            for (const c of placement) {
                if (c.name.toLowerCase().includes(searchName)) {
                    found.push(c);
                }
            }
        }

        // 4 — Aucun résultat
        if (found.length === 0)
            return repondre(`❌ Aucune carte trouvée pour : ${searchName}`);

        // 5 — Affichage liste
        let list = "📋 Cartes trouvées :\n\n";
        found.forEach((c, i) => {
            list += `${i + 1}. ${c.name} — Grade: ${c.grade} — Catégorie: ${c.category} — Prix: ${c.price}\n`;
        });

        await repondre(list + "\nTu as 5 minutes pour choisir un numéro.");

        // 6 — Attente numéro (5 min)
        const rep2 = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 300000 });
        const texte2 = rep2.message?.extendedTextMessage?.text || rep2.message?.conversation || "";
        const choix = parseInt(texte2.trim());

        if (isNaN(choix) || choix < 1 || choix > found.length)
            return repondre("❌ Numéro invalide.");

        const card = found[choix - 1];

        // 7 — Affichage carte + confirmation
        await ovl.sendMessage(ms_org, {
            image: { url: card.image },
            caption: `Carte sélectionnée :

Nom : ${card.name}
Grade : ${card.grade}
Catégorie : ${card.category}
Placement : ${card.placement}
Prix : ${card.price}

Confirmer ? (oui / non)`
        }, { quoted: ms });

        // 8 — Confirmation
        const rep3 = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 120000 });
        const texte3 = rep3.message?.extendedTextMessage?.text || rep3.message?.conversation || "";
        const r3 = texte3.toLowerCase().trim();

        if (!["oui", "yes", "y"].includes(r3))
            return repondre("Achat annulé.");

        // 9 — Débit NP + monnaie
        let prixText = card.price.replace('🧭', '').replace('🔷', '').replace(/\s/g, '');
        let prix = parseInt(prixText) || 0;

        let np = parseInt(userData.np);
        if (np < 1) return repondre("❌ Pas assez de NP.");

        await MyNeoFunctions.updateUser(auteur_Message, { np: np - 1 });

        // Paiement en golds
        if (card.price.includes("🧭")) {
            let golds = parseInt(fiche.golds);
            if (golds < prix) return repondre("❌ Pas assez de golds.");
            await setfiche("golds", golds - prix, auteur_Message);
        }

        // Paiement en NC
        if (card.price.includes("🔷")) {
            let nc = parseInt(userData.nc);
            if (nc < prix) return repondre("❌ Pas assez de NC.");
            await MyNeoFunctions.updateUser(auteur_Message, { nc: nc - prix });
        }

        // 10 — Reçu
        const facture = `
╭───〔 BOUTIQUE NEO 〕─────── 
Client : ${fiche.code_fiche}

Débit :
• 1 NP
• ${prix} ${card.price.includes("🔷") ? "NC" : "G🧭"}
╰───────────────────`;

        await ovl.sendMessage(ms_org, {
            image: { url: card.image },
            caption: facture
        }, { quoted: ms });

        await repondre("Achat réussi.");

    } catch (e) {
        console.log(e);
        repondre("❌ Erreur dans la boutique.");
    }
});
