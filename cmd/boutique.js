const { ovlcmd } = require('../lib/ovlcmd');
const { cards } = require('../DataBase/cards');
const { MyNeoFunctions } = require("../DataBase/myneo_lineup_team");
const { getData, setfiche } = require("../DataBase/allstars_divs_fiches");
const config = require("../set");

// --- UTILITAIRES ---
function getCurrencyIcon(currency) {
  if (currency === "nc") return "🔷";
  if (currency === "golds") return "🧭";
  return "";
}
const formatNumber = n => {
    try { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    catch { return n; }
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

😃Bienvenue dans la boutique NEO🛍️Store🛒, pour faire un achat il vous suffit de taper comme ceci :
🛍️achat: sasuke(Hebi)/ 🛍️vente: sasuke(Hebi). Après cela attendez la validation de votre achat ou de votre vente.
#Happy202️⃣6️⃣🎊🎄
╰───────────────────
                          *🔷NEO🛍️STORE*`
        }, { quoted: ms });

        const waitFor = async (timeout = 120000) => {
            const r = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: timeout });
            const txt = r?.message?.extendedTextMessage?.text || r?.message?.conversation || "";
            return txt ? txt.trim() : "";
        }

        const allCards = [];
        for (const [placementKey, placementCards] of Object.entries(cards)) {
            for (const c of placementCards) allCards.push({ ...c, placement: placementKey });
        }

        let sessionOpen = true;
        let userInput = await waitFor(120000);
        if (!userInput) return repondre("❌ Temps écoulé. Session fermée.");

        while (sessionOpen) {
            try {
                if (!userInput) {
                    userInput = await waitFor(120000);
                    if (!userInput) return repondre("❌ Temps écoulé. Session fermée.");
                }

                if (userInput.toLowerCase() === "close") {
                    await repondre("✅ Boutique fermée.");
                    break;
                }

                // --- DÉTECTION MODE ACHAT/VENTE ---
                const cleanedInput = userInput.replace(/[^a-zA-Z]/g,"").toLowerCase(); // retire emoji, espaces
                let mode = null;
                if(cleanedInput.startsWith("vente")) mode = "vente";
                else if(cleanedInput.startsWith("achat")) mode = "achat";
                if(!mode) { userInput = await waitFor(120000); continue; }

                let parts = userInput.split(":");
                if (parts.length < 2) { userInput = await waitFor(120000); continue; }

                let query = parts.slice(1).join(":").trim();
                if (!query) { await repondre("❌ Tu dois écrire un nom après ':'"); userInput = await waitFor(120000); continue; }

                const q = query.toLowerCase().replace(/[\s\-\_]/g, "");
                let card = allCards.find(c => c.name.toLowerCase().replace(/[\s\-\_]/g, "") === q)
                        || allCards.find(c => c.name.toLowerCase().includes(q));
                if (!card) { await repondre(`❌ Aucune carte trouvée pour : ${query}`); userInput = await waitFor(120000); continue; }

                // --- Vérification du niveau pour l'achat ---
let userLevel = parseInt(fiche.niveu_xp || 0);
let cardGrade = card.grade?.toUpperCase() || "";

if (["SS-", "SS", "SS+"].includes(cardGrade) && userLevel < 10) {
    await repondre(`❌ Niveau insuffisant pour acheter cette carte (niveau requis : 10). Ton niveau : ${userLevel}`);
    userInput = await waitFor(120000);
    continue;
}

if (cardGrade === "OR" && userLevel < 5) {
    await repondre(`❌ Niveau insuffisant pour acheter cette carte OR (niveau requis : 5). Ton niveau : ${userLevel}`);
    userInput = await waitFor(120000);
    continue;
}
                
                let basePrix = parseInt((card.price || "").replace(/[^\d]/g, "")) || 0;
                let golds = parseInt(fiche.golds || 0);
                let nc = parseInt(userData.nc || 0);
const icon = getCurrencyIcon(card.currency);
                await ovl.sendMessage(ms_org, {
                    image: { url: card.image },
                    caption: `🎴 Carte: ${card.name}
Grade: ${card.rarity}
Catégorie: ${card.type}
Placement: ${card.placement}
🛍️Prix: ${card.price} ${icon}

✔️ Confirmer achat ? (oui/non/+coupon)
`);
                }, { quoted: ms });

                let conf = (await waitFor(60000))?.toLowerCase() || "";
                
                if(conf.includes("non")) { 
                    await repondre("❌ Transaction annulée."); 
                    userInput = await waitFor(120000); 
                    continue; 
                }

                if(!conf.includes("oui") && !conf.includes("+coupon")) { 
                    await repondre("❌ Réponse invalide."); 
                    userInput = await waitFor(120000); 
                    continue; 
                }

                // --- GESTION COUPON ---
                let couponUsed = false;
                let finalPrice = basePrix;
                if (conf.includes("+coupon") && mode === "achat") {
                    const userCoupons = parseInt(userData.coupons || 0);
                    if (userCoupons < 100) { await repondre("❌ Pas assez de coupons."); userInput = await waitFor(120000); continue; }
                    finalPrice = Math.floor(finalPrice / 2);
                    couponUsed = true;
                    await MyNeoFunctions.updateUser(auteur_Message, { coupons: userCoupons - 100 });
                }

   if (mode === "achat") {
    let np = parseInt(userData.np || 0);
    if (np < 1) { await repondre("❌ Pas assez de NP"); userInput = await waitFor(120000); continue; }

    // Prix final avant transaction
    let finalPrice = basePrix;
    let couponUsed = false;

    if(conf.includes("+coupon")) {
        const userCoupons = parseInt(userData.coupons || 0);
        if (userCoupons < 100) {
            await repondre("❌ Pas assez de coupons.");
            userInput = await waitFor(120000);
            continue;
        }
        finalPrice = Math.floor(finalPrice / 2);
        couponUsed = true;
        await MyNeoFunctions.updateUser(auteur_Message, { coupons: userCoupons - 100 });
    }

    if (golds < finalPrice && nc < finalPrice) { await repondre("❌ Pas assez de fonds"); userInput = await waitFor(120000); continue; }

    // Déduction NP
    await MyNeoFunctions.updateUser(auteur_Message, { np: np - 1 });

    if (golds >= finalPrice) await setfiche("golds", golds - finalPrice, auteur_Message);
    else await MyNeoFunctions.updateUser(auteur_Message, { nc: nc - finalPrice });

    let currentCards = (fiche.cards || "").split("\n").map(x => x.trim()).filter(Boolean);
    if (!currentCards.includes(card.name)) currentCards.push(card.name);
    await setfiche("cards", currentCards.join("\n"), auteur_Message);

    // +5 NS
    let currentNS = parseInt(userData.ns || 0) + 5;
    await MyNeoFunctions.updateUser(auteur_Message, { ns: currentNS });

    // Reçu
    await ovl.sendMessage(ms_org, {
        image: { url: card.image },
        caption: `╭───〔 🌀🛍️ REÇU D’ACHAT 〕─  

👤 Client: ${fiche.code_fiche}
🎴 Carte ajoutée: ${card.name}
💳 Paiement: 1 NP + ${formatNumber(finalPrice)} 🧭
${couponUsed ? "✅ Coupon utilisé 100🎟️" : ""}
👑 +5 NS ajouté ! Royalities xp 👑🎉🍾🥂

Merci pour ton achat !
╰───────────────────`
    }, { quoted: ms });
   }             
                                           
                // --- VENTE ---
else if (mode === "vente") {

    function cleanName(name) {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        // retire tous les emojis SAUF 🎰
        .replace(/([\p{Emoji_Presentation}\p{Emoji}\u200d](?!🎰))/gu, "")
        .replace(/[^a-z0-9🎰]/gi, "") // autorise 🎰
        .trim();
}

    function isJackpotCard(cardName) {
        return cardName.includes("🎰");
    }

    let currentCards = (fiche.cards || "").split("\n").map(x => x.trim()).filter(Boolean);

    let cleanedTarget = cleanName(card.name);

    let idx = currentCards.findIndex(c => cleanName(c) === cleanedTarget);

    if (idx === -1) {
        await repondre("❌ Tu ne possèdes pas cette carte");
        userInput = await waitFor(120000);
        continue;
    }

    // Suppression
    currentCards.splice(idx, 1);
    await setfiche("cards", currentCards.join("\n"), auteur_Message);

    // Prix de vente
    let finalSalePrice = Math.floor(basePrix / 2);

    if (isJackpotCard(currentCards[idx])) {
    finalSalePrice = 0;
    } // 🔥 Cartes 🎰 → rapportent 0
    
    await setfiche("golds", parseInt(fiche.golds || 0) + finalSalePrice, auteur_Message);

    // Reçu
    await ovl.sendMessage(ms_org, {
        image: { url: card.image },
        caption: `╭───〔 🌀🛍️ REÇU DE VENTE 〕─  

👤 Client: ${fiche.code_fiche}
🎴 Carte retirée: ${card.name}
💳 Tu as reçu: ${formatNumber(finalSalePrice)} 🧭

╰───────────────────`
    }, { quoted: ms });
}
                userData = await MyNeoFunctions.getUserData(auteur_Message);
                fiche = await getData({ jid: auteur_Message });
                userInput = await waitFor(120000);

            } catch(innerErr) {
                console.log("Erreur session boutique interne:", innerErr);
                await repondre("🛍️Boutique en attente… tape `close` pour fermer.");
                userInput = await waitFor(120000);
            }
        }

    } catch(e) {
        console.log("Erreur boutique critique:", e);
        return repondre("🛍️Boutique en attente… tape \"close\" pour fermer.");
    }
});
