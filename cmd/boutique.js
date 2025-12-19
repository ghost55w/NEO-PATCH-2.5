const { ovlcmd } = require('../lib/ovlcmd');
const { cards } = require('../DataBase/cards');
const { MyNeoFunctions } = require("../DataBase/myneo_lineup_team");
const { getData, setfiche } = require("../DataBase/allstars_divs_fiches");
const config = require("../set");

//-------- UTILITAIRES
const formatNumber = n => {
    try {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch {
        return n;
    }
};

//-------- NORMALISATION (ANTI BUG CARTES)
const normalize = str =>
    String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");

//-------- COMMANDE BOUTIQUE
ovlcmd({
    nom_cmd: "boutique",
    react: "🛒",
    classe: "NEO_GAMES"
}, async (ms_org, ovl, { ms, auteur_Message, repondre }) => {

    try {
        let userData = await MyNeoFunctions.getUserData(auteur_Message);
        let fiche = await getData({ jid: auteur_Message });
        if (!userData || !fiche) return repondre("❌ Impossible de récupérer ta fiche.");

        //-------- TEXTE D'ACCUEIL
        await ovl.sendMessage(ms_org, {
            image: { url: 'https://files.catbox.moe/i87tdr.png' },
            caption: `╭────〔 *🛍️BOUTIQUE🛒* 〕  

😃Bienvenue dans la boutique NEO🛍️Store🛒, pour faire un achat il vous suffit de taper comme ceci :
🛍️achat: sasuke(Hebi) / 🛍️vente: sasuke(Hebi)

Après cela attendez la validation de votre achat ou de votre vente.
#Happy202️⃣6️⃣🎊🎄
╰───────────────────
                          *🔷NEO🛍️STORE*`
        }, { quoted: ms });

        //-------- ATTENTE MESSAGE
        const waitFor = async (timeout = 120000) => {
            const r = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: timeout });
            const txt =
                r?.message?.extendedTextMessage?.text ||
                r?.message?.conversation ||
                "";
            return txt ? txt.trim() : "";
        };

        //-------- LISTE CARTES
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

                if (userInput.toLowerCase() === "close") {
                    await repondre("✅ Boutique fermée.");
                    break;
                }

                //-------- DÉTECTION MODE
                const cleanedInput = userInput.replace(/[^a-zA-Z]/g, "").toLowerCase();
                let mode = null;
                if (cleanedInput.startsWith("achat")) mode = "achat";
                else if (cleanedInput.startsWith("vente")) mode = "vente";
                else {
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
                const card =
                    allCards.find(c => c.name.toLowerCase().replace(/[\s\-_]/g, "") === q) ||
                    allCards.find(c => c.name.toLowerCase().includes(q));

                if (!card) {
                    await repondre(`❌ Aucune carte trouvée pour : ${query}`);
                    userInput = await waitFor();
                    continue;
                }

                //-------- FONDS (NETTOYÉS)
                let basePrix = parseInt((card.price || "").replace(/[^\d]/g, "")) || 0;
                let golds = parseInt(String(fiche.golds || "0").replace(/[^\d]/g, "")) || 0;
                let nc = parseInt(String(userData.nc || "0").replace(/[^\d]/g, "")) || 0;

                //-------- CONFIRMATION
                await ovl.sendMessage(ms_org, {
                    image: { url: card.image },
                    caption: `🎴 Carte: ${card.name}
🔅 Grade: ${card.grade}
🔅 Catégorie: ${card.category}
🔅 Placement: ${card.placement}
🛍️ Prix: ${formatNumber(basePrix)} 🧭

✔️ Confirmer ${mode} ? (oui / non / +coupon)
╰───────────────────`
                }, { quoted: ms });

                const conf = (await waitFor(60000)).toLowerCase();
                if (conf.includes("non") || !conf) {
                    await repondre("❌ Transaction annulée.");
                    userInput = await waitFor();
                    continue;
                }

                //-------- ACHAT
                if (mode === "achat") {

                    let np = parseInt(userData.np || 0);
                    if (np < 1) {
                        await repondre("❌ Pas assez de NP.");
                        userInput = await waitFor();
                        continue;
                    }

                    let finalPrice = basePrix;
                    let couponUsed = false;

                    if (conf.includes("+coupon")) {
                        const userCoupons = parseInt(userData.coupons || 0);
                        if (userCoupons < 100) {
                            await repondre("❌ Pas assez de coupons.");
                            userInput = await waitFor();
                            continue;
                        }
                        finalPrice = Math.floor(finalPrice / 2);
                        couponUsed = true;
                        await MyNeoFunctions.updateUser(auteur_Message, {
                            coupons: userCoupons - 100
                        });
                    }

                    if (golds < finalPrice && nc < finalPrice) {
                        await repondre("❌ Pas assez de fonds.");
                        userInput = await waitFor();
                        continue;
                    }

                    await MyNeoFunctions.updateUser(auteur_Message, { np: np - 1 });

                    if (golds >= finalPrice)
                        await setfiche("golds", golds - finalPrice, auteur_Message);
                    else
                        await MyNeoFunctions.updateUser(auteur_Message, { nc: nc - finalPrice });

                    const cardsList = (fiche.cards || "")
                        .split("\n")
                        .map(x => x.trim())
                        .filter(Boolean);

                    if (!cardsList.some(c => normalize(c) === normalize(card.name)))
                        cardsList.push(card.name);

                    await setfiche("cards", cardsList.join("\n"), auteur_Message);

                    await MyNeoFunctions.updateUser(auteur_Message, {
                        ns: (userData.ns || 0) + 5
                    });

                    await ovl.sendMessage(ms_org, {
                        image: { url: card.image },
                        caption: `╭───〔 🛍️ REÇU D’ACHAT 〕───────  

👤 Client: ${fiche.code_fiche}
🎴 Carte ajoutée: ${card.name}
💳 Paiement: 1 NP + ${formatNumber(finalPrice)} 🧭
${couponUsed ? "✅ Coupon utilisé (100🎟️)" : ""}
👑 +5 NS ajouté ! Royalities xp 👑🎉🍾🥂

Merci pour ton achat !
╰───────────────────`
                    }, { quoted: ms });
                }

                //-------- VENTE
                else if (mode === "vente") {

                    let cardsList = (fiche.cards || "")
                        .split("\n")
                        .map(x => x.trim())
                        .filter(Boolean);

                    const index = cardsList.findIndex(
                        c => normalize(c) === normalize(card.name)
                    );

                    if (index === -1) {
                        await repondre("❌ Tu ne possèdes pas cette carte.");
                        userInput = await waitFor();
                        continue;
                    }

                    cardsList.splice(index, 1);
                    await setfiche("cards", cardsList.join("\n"), auteur_Message);

                    let finalSalePrice = Math.floor(basePrix / 2);
                    if (card.name.includes("🎰")) finalSalePrice = basePrix;

                    await setfiche(
                        "golds",
                        golds + finalSalePrice,
                        auteur_Message
                    );

                    await ovl.sendMessage(ms_org, {
                        image: { url: card.image },
                        caption: `╭───〔 🛍️ REÇU DE VENTE 〕───────  

👤 Client: ${fiche.code_fiche}
🎴 Carte retirée: ${card.name}
💳 Tu as reçu: ${formatNumber(finalSalePrice)} 🧭
╰───────────────────`
                    }, { quoted: ms });
                }

                userData = await MyNeoFunctions.getUserData(auteur_Message);
                fiche = await getData({ jid: auteur_Message });
                userInput = await waitFor();

            } catch (innerErr) {
                console.log("Erreur session boutique:", innerErr);
                await repondre("🛍️ Boutique en attente… tape `close` pour fermer.");
                userInput = await waitFor();
            }
        }

    } catch (e) {
        console.log("Erreur boutique critique:", e);
        return repondre("🛍️ Boutique en attente… tape \"close\" pour fermer.");
    }
});
