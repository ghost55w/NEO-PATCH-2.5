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

    // Ajout de l'OVR au prix : chaque point d'OVR = 1000
    let bonusOvr = ovr * 1000;

    return baseRankPrice + bonusOvr;
} 

// --- TRANSFORMATION DES CARTES ---
const allCards = Object.entries(cardsBlueLock).map(([key, c]) => {
    const fullCard = { id: key, ...c };
    return {
        ...fullCard,
        price: calculPrix(fullCard)
    };
});

// --- Fonction utilitaire pour insérer dans le lineup ---
async function addToLineup(auteur_Message, card, ovl, ms_org, repondre) {
    const ficheLineup = await getData({ jid: auteur_Message });
    if (!ficheLineup) return;

    // Crée le lineup si n'existe pas
    if (!ficheLineup.lineup) {
        ficheLineup.lineup = Array(15).fill(null);
    }

    // Vérifie si il y a de la place
    const freePositions = ficheLineup.lineup.map((p, i) => p === null ? i : -1).filter(i => i !== -1);

    if (freePositions.length === 0) {
        await repondre("❌ Tu n’as plus de place dans ton lineup ! (1 à 15)");
        return false;
    }

    // Envoie le message pour choisir une position
    await repondre(`✅ Carte achetée : ${card.name} (${card.ovr})\nChoisis la position où la placer dans ton lineup (1-15). Positions libres : ${freePositions.map(i => `J${i+1}`).join(", ")}`);

    // Attend la réponse de l’utilisateur
    const waitFor = async (timeout = 60000) => {
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

    let positionChoisie = await waitFor();
    if (!positionChoisie) {
        await repondre("❌ Temps écoulé. Carte non placée dans le lineup.");
        return false;
    }

    // Convertit en index
    positionChoisie = parseInt(positionChoisie.replace(/[^\d]/g, "")) - 1;

    if (positionChoisie < 0 || positionChoisie > 14) {
        await repondre("❌ Position invalide ! Doit être entre 1 et 15.");
        return false;
    }

    if (ficheLineup.lineup[positionChoisie] !== null) {
        await repondre("❌ Cette position est déjà occupée !");
        return false;
    }

    // Ajoute la carte dans le lineup
    ficheLineup.lineup[positionChoisie] = {
        name: card.name,
        overall: card.ovr,
        country: card.country,
        flag: card.flag || "", // drapeau
        poste: card.poste || "Non défini"
    };

    // Sauvegarde le lineup
    await setfiche("lineup", ficheLineup.lineup, auteur_Message);

    await repondre(`✅ ${card.name} placé en position J${positionChoisie+1} dans ton lineup !`);
    return true;
}

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
    let np = userData.np || 0;                // NP du joueur
    let argent = fiche.argent || 0;           // Argent du joueur

    if (np < 1) {
        await repondre("❌ Pas assez de NP !");
        userInput = await waitFor();
        continue;
    }

    // Détermine le prix final avec coupon si utilisé
    let couponUsed = false;
    let finalPrice = basePrix;

    if (conf.includes("+coupon")) {
        const coupons = userData.coupons || 0;
        if (coupons < 100) {
            await repondre("❌ Pas assez de coupons !");
            userInput = await waitFor();
            continue;
        }
        finalPrice = Math.floor(basePrix / 2);
        couponUsed = true;
        await MyNeoFunctions.updateUser(auteur_Message, { coupons: coupons - 100 });
    }

    // Vérifie si l'argent est suffisant
    if (argent < finalPrice) {
        await repondre("❌ Pas assez d'argent !");
        userInput = await waitFor();
        continue;
    }

    // Retire NP et argent
    await MyNeoFunctions.updateUser(auteur_Message, { np: np - 1 });
    await setfiche("argent", argent - finalPrice, auteur_Message);

    // Ajoute la carte
    let cardsOwned = (fiche.cards || "").split("\n").filter(Boolean);
    if (!cardsOwned.includes(card.name)) cardsOwned.push(card.name);
    await setfiche("cards", cardsOwned.join("\n"), auteur_Message);

    // Ajoute NS
    await MyNeoFunctions.updateUser(auteur_Message, { ns: (userData.ns + 5) });

    // --- PLACE DANS LE LINEUP ---
    await addToLineup(auteur_Message, card, ovl, ms_org, repondre);

    // --- ENVOI DU REÇU ---
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
                    // ... reste inchangé
                }

                userData = await MyNeoFunctions.getUserData(auteur_Message);
                fiche = await getData({ jid: auteur_Message });
                userInput = await waitFor();

            } catch (err) {
                console.log("Erreur interne BL:", err);
                await repondre("⚽ Boutique en attente… tape `close` pour quitter.");
                userInput = await waitFor();
            }
        }

    } catch (err) {
        console.log("Erreur critique BL:", err);
        return repondre("⚽Erreur inattendue. Tape `close` pour quitter.");
    }
});
