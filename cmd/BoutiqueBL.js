const { ovlcmd } = require('../lib/ovlcmd');
const { MyNeoFunctions } = require("../DataBase/myneo_lineup_team");
const { getData, setfiche } = require("../DataBase/allstars_divs_fiches");
const { cardsBlueLock } = require("../DataBase/cardsBL");
const config = require("../set");

// --- UTILITAIRES ---
const formatNumber = n => {
    try { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    catch { return n; }
};

function toNumber(n) {
    if (!n) return 0;
    return parseInt(n.toString().replace(/[^0-9\-]/g, ""));
}

// --- CALCUL DU PRIX (PLACÉ AU BON ENDROIT) ---
function calculPrix(card) {

    let baseRankPrice = {
        "S": 1_000_000,
        "SS": 3_000_000
    }[card.rank] || 100_000;

    let ovr = parseInt(card.ovr || 0);
    let lastDigit = ovr % 10;
    let bonus = lastDigit * 10_000;

    return baseRankPrice + bonus;
}

// --- TRANSFORMATION DES CARTES ---
const allCards = Object.entries(cardsBlueLock).map(([key, c]) => {
    const fullCard = { id: key, ...c };
    return {
        ...fullCard,
        price: calculPrix(fullCard)
    };
});

// --- COMMANDE BOUTIQUE BLUE LOCK ---
ovlcmd({
    nom_cmd: "boutiquebl",
    react: "⚽",
    classe: "NEO_GAMES⚽"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {

    try {
        let userData = await MyNeoFunctions.getUserData(auteur_Message);
        let fiche = await getData({ jid: auteur_Message });

        if (!userData || !fiche) return repondre("❌ Impossible de récupérer ta fiche.");

        // --- TEXTE D'ACCUEIL ---
        await ovl.sendMessage(ms_org, {
            image: { url: 'https://files.catbox.moe/s5pyu9.jpg' },
            caption: `╭───〔 *⚽BOUTIQUE BLUE LOCK🔷* 〕  

😃Bienvenue dans la boutique BLUE🔷LOCK ! 🛒🛍️🎁
Pour acheter ou vendre une carte :
⚽Achat: Isagi / ⚽vente: Isagi (NEL)
Ensuite attends la validation du système✅ !
pour fermer la session de boutique 👉🏽 close.

*#Happy202️⃣6️⃣🎊🎄🎁*
╰───────────────────
                 *🔷BLUE LOCK🛍️ STORE*`
        }, { quoted: ms });

        const waitFor = async (timeout = 120000) => {
            try {
                const r = await ovl.recup_msg({
                    auteur: auteur_Message,
                    ms_org,
                    temps: timeout
                });
                const txt = r?.message?.extendedTextMessage?.text || r?.message?.conversation || "";
                return txt.trim();
            } catch {
                return "";
            }
        };

        let userInput = await waitFor();
        if (!userInput) return repondre("❌ Temps écoulé. Session fermée.");

        let sessionOpen = true;

        while (sessionOpen) {
            try {

                if (userInput.toLowerCase() === "close") {
                    await repondre("✅ Boutique fermée.");
                    break;
                }

                const cleaned = userInput.replace(/[^a-zA-Z]/g, "").toLowerCase();
                let mode = null;

                if (cleaned.startsWith("achat")) mode = "achat";
                else if (cleaned.startsWith("vente")) mode = "vente";

                if (!mode) {
                    userInput = await waitFor();
                    continue;
                }

                // --- EXTRACTION DU NOM ---
                const parts = userInput.split(":");
                if (parts.length < 2) { userInput = await waitFor(); continue; }

                let query = parts.slice(1).join(":").trim().toLowerCase();
                if (!query) {
                    await repondre("❌ Tu dois écrire un nom après ':'");
                    userInput = await waitFor();
                    continue;
                }

                const q = query.replace(/[\s\-\_]/g, "");

                // --- RECHERCHE DE CARTE ---
                let card = allCards.find(c =>
                    c.name.toLowerCase().replace(/[\s\-\_]/g, "") === q
                ) || allCards.find(c =>
                    c.name.toLowerCase().replace(/[\s\-\_]/g, "").includes(q)
                );

                if (!card) {
                    await repondre(`❌ Aucune carte trouvée pour : ${query}`);
                    userInput = await waitFor();
                    continue;
                }

                let basePrix = toNumber(card.price);
let argent = toNumber(fiche.argent);
let nc = toNumber(userData.nc);

                // --- MESSAGE CARTE ---
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

💳 Prix : ${formatNumber(basePrix)} 💶

Confirmer ${mode} ? (oui / non / +coupon)
╰───────────────────
                  *BLUE🔷LOCK*`
                }, { quoted: ms });

                let conf = (await waitFor(60000)).toLowerCase();

                if (conf.includes("non")) {
                    await repondre("❌ Transaction annulée.");
                    userInput = await waitFor();
                    continue;
                }

                if (!conf.includes("oui") && !conf.includes("+coupon")) {
                    await repondre("❌ Réponse invalide.");
                    userInput = await waitFor();
                    continue;
                }

                // --- COUPON ---
                let couponUsed = false;
                let finalPrice = basePrix;

                if (conf.includes("+coupon") && mode === "achat") {
                    const coupons = parseInt(userData.coupons || 0);
                    if (coupons < 100) {
                        await repondre("❌ Pas assez de coupons !");
                        userInput = await waitFor();
                        continue;
                    }
                    finalPrice = Math.floor(basePrix / 2);
                    couponUsed = true;
                    await MyNeoFunctions.updateUser(auteur_Message, { coupons: coupons - 100 });
                }

                // --- ACHAT ---
                if (mode === "achat") {

                    let np = toNumber(userData.np);
                    if (np < 1) {
                        await repondre("❌ Pas assez de NP !");
                        userInput = await waitFor();
                        continue;
                    }

                    if (argent < finalPrice && nc < finalPrice) {
                        await repondre("❌ Fonds insuffisants !");
                        userInput = await waitFor();
                        continue;
                    }

                    await MyNeoFunctions.updateUser(auteur_Message, { np: np - 1 });

                    if (argent >= finalPrice)
                        await setfiche("argent", argent - finalPrice, auteur_Message);
                    else
                        await MyNeoFunctions.updateUser(auteur_Message, { nc: nc - finalPrice });

                    let cardsOwned = (fiche.cards || "").split("\n").filter(Boolean);
                    if (!cardsOwned.includes(card.name)) cardsOwned.push(card.name);

                    await setfiche("cards", cardsOwned.join("\n"), auteur_Message);

                    await MyNeoFunctions.updateUser(auteur_Message, { ns: (userData.ns + 5) });

                    await repondre(`
╭───〔 ⚽ REÇU D’ACHAT 🔷 〕──  
🔥 ${card.name} ajouté !
💳 Paiement : 1 NP + ${formatNumber(finalPrice)} 💶
${couponUsed ? "🎟️ Coupon utilisé (-50%)" : ""}
👑 +5 NS ajoutés !

Merci pour ton achat !
╰───────────────────
                  *BLUE🔷LOCK*`);
                }

                // --- VENTE ---
                else if (mode === "vente") {

                    let cardsOwned = (fiche.cards || "").split("\n").filter(Boolean);
                    const idx = cardsOwned.findIndex(c => c.toLowerCase() === card.name.toLowerCase());

                    if (idx === -1) {
                        await repondre("❌ Tu ne possèdes pas cette carte !");
                        userInput = await waitFor();
                        continue;
                    }

                    cardsOwned.splice(idx, 1);
                    await setfiche("cards", cardsOwned.join("\n"), auteur_Message);

                    let salePrice = Math.floor(basePrix / 2);

                    await setfiche("argent",
    toNumber(fiche.argent) + salePrice,
    auteur_Message
);

                    await repondre(`
╭───〔 ⚽ REÇU DE VENTE 🔷 〕── 
🔹 Carte vendue : ${card.name}
💶 Gain : ${formatNumber(salePrice)}

╰───────────────────
                  *BLUE🔷LOCK*`);
                }

                userData = await MyNeoFunctions.getUserData(auteur_Message);
                fiche = await getData({ jid: auteur_Message });
                userInput = await waitFor();

            } catch (err) {
                console.log("Erreur interne BL:", err);
                await repondre("⚽ Boutique en attente… tape \`close\` pour quitter.");
                userInput = await waitFor();
            }
        }

    } catch (err) {
        console.log("Erreur critique BL:", err);
        return repondre("⚽Erreur inattendue. Tape \`close\` pour quitter.");
    }
});
