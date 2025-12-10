const { ovlcmd } = require('../lib/ovlcmd');
const { MyNeoFunctions } = require("../DataBase/myneo_lineup_team");
const { getData, setfiche } = require("../DataBase/allstars_divs_fiches");
const { cardsBlueLock } = require("../DataBase/cardsBL");
const { TeamFunctions } = require("../DataBase/myneo_lineup_team"); // <--- utiliser TeamFunctions pour l'argent
const config = require("../set");

// --- UTILITAIRES ---
const formatNumber = n => {
    try { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    catch { return n; }
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
        price: calculPrix(fullCard)
    };
});

// --- Fonction pour insérer dans le lineup ---
// --- Fonction sécurisée pour insérer dans le lineup ---
async function addToLineup(auteur_Message, card, ovl, ms_org, repondre) {
    try {
        // 🔄 Récupération de la fiche lineup
        const ficheLineup = await getData({ jid: auteur_Message });
        if (!ficheLineup) {
            await repondre("❌ Impossible de récupérer ton lineup.");
            return false;
        }

        // 🔄 Initialisation si lineup n'existe pas
        if (!ficheLineup.lineup || !Array.isArray(ficheLineup.lineup)) {
            ficheLineup.lineup = Array(15).fill(null);
        }

        // 🔄 Positions libres
        const freePositions = ficheLineup.lineup
            .map((p, i) => (p === null ? i : -1))
            .filter(i => i !== -1);

        if (freePositions.length === 0) {
            await repondre("❌ Tu n’as plus de place dans ton lineup ! (1 à 15)");
            return false;
        }

        await repondre(`✅ Carte achetée : ${card.name} (${card.ovr})\nChoisis la position où la placer dans ton lineup (1-15). Positions libres : ${freePositions.map(i => `J${i+1}`).join(", ")}`);

        // 🔄 Fonction pour récupérer la réponse de l’utilisateur
        const waitFor = async (timeout = 60000) => {
            try {
                const r = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: timeout });
                const txt = r?.message?.extendedTextMessage?.text || r?.message?.conversation || "";
                return txt.trim().toLowerCase();
            } catch {
                return "";
            }
        };

        let positionChoisie = await waitFor();
        if (!positionChoisie) {
            await repondre("❌ Temps écoulé. Carte non placée dans le lineup.");
            return false;
        }

        // 🔢 Extraire uniquement le chiffre (J6 → 6, 6 → 6)
        const match = positionChoisie.match(/\d+/);
        if (!match) {
            await repondre("❌ Position invalide ! Doit être entre 1 et 15.");
            return false;
        }

        positionChoisie = parseInt(match[0], 10) - 1;

        // 🔄 Vérification des limites
        if (positionChoisie < 0 || positionChoisie > 14) {
            await repondre("❌ Position invalide ! Doit être entre 1 et 15.");
            return false;
        }

        // 🔄 Vérification si la position est déjà occupée
        if (ficheLineup.lineup[positionChoisie] !== null) {
            await repondre("❌ Cette position est déjà occupée !");
            return false;
        }

        // ✅ Placement de la carte
        ficheLineup.lineup[positionChoisie] = {
            name: card.name,
            overall: card.ovr,
            country: card.country,
            flag: card.flag || "",
            poste: card.poste || "Non défini"
        };

        await setfiche("lineup", ficheLineup.lineup, auteur_Message);
        await repondre(`✅ ${card.name} placé en position J${positionChoisie+1} dans ton lineup !`);
        return true;

    } catch (err) {
        console.log("Erreur addToLineup:", err);
        await repondre("❌ Erreur interne lors du placement de la carte.");
        return false;
    }
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

        // 🔥 CONVERSION INITIALE DE L'ARGENT (nombre pur)
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

*#Happy202️⃣6️⃣🎊🎄🎁*
╰───────────────────
                 *🔷BLUE LOCK🛍️ STORE*`
        }, { quoted: ms });

        const waitFor = async (timeout = 120000) => {
            try {
                const r = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: timeout });
                const txt = r?.message?.extendedTextMessage?.text || r?.message?.conversation || "";
                return txt.trim();
            } catch { return ""; }
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

                const parts = userInput.split(":");
                if (parts.length < 2) { userInput = await waitFor(); continue; }

                let query = parts.slice(1).join(":").trim().toLowerCase();
                if (!query) {
                    await repondre("❌ Tu dois écrire un nom après ':'");
                    userInput = await waitFor();
                    continue;
                }

                const q = query.replace(/[\s\-\_]/g, "");
                let card = allCards.find(c => c.name.toLowerCase().replace(/[\s\-\_]/g, "") === q)
                        || allCards.find(c => c.name.toLowerCase().replace(/[\s\-\_]/g, "").includes(q));

                if (!card) {
                    await repondre(`❌ Aucune carte trouvée pour : ${query}`);
                    userInput = await waitFor();
                    continue;
                }

                let basePrix = card.price;

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

💳 Prix : ${basePrix} 💶

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

                // 🔄 Récupération à jour Team + MyNeo
                ficheTeam = await TeamFunctions.getUserData(auteur_Message);
                ficheTeam.argent = Number(ficheTeam.argent) || 0;
                userData = await MyNeoFunctions.getUserData(auteur_Message);
                let np = userData.np || 0;

                // --- ACHAT ---
                if (mode === "achat") {
                    let finalPrice = basePrix;
                    let couponUsed = false;

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

                    if (np < 1) {
                        await repondre("❌ Pas assez de NP !");
                        userInput = await waitFor();
                        continue;
                    }

                    if (ficheTeam.argent < finalPrice) {
                        await repondre(`❌ Pas assez d'argent ! 💶 Argent actuel : ${ficheTeam.argent} | Prix : ${finalPrice}`);
                        userInput = await waitFor();
                        continue;
                    }

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
                  *BLUE🔷LOCK*`);
                }

                // --- VENTE ---
                else if (mode === "vente") {
                    let cardsOwned = (userData.cards || "").split("\n").filter(Boolean);
                    const idx = cardsOwned.findIndex(c => c.toLowerCase() === card.name.toLowerCase());

                    if (idx === -1) {
                        await repondre("❌ Tu ne possèdes pas cette carte !");
                        userInput = await waitFor();
                        continue;
                    }

                    cardsOwned.splice(idx, 1);
                    await MyNeoFunctions.updateUser(auteur_Message, { cards: cardsOwned.join("\n") });

                    let salePrice = Math.floor(basePrix / 2);
                    await TeamFunctions.updateUser(auteur_Message, { argent: ficheTeam.argent + salePrice });

                    await repondre(`
╭───〔 ⚽ REÇU DE VENTE 🔷 〕── 
🔹 Carte vendue : ${card.name}
💶 Gain : ${salePrice}
💰 Argent actuel : ${ficheTeam.argent + salePrice}


╰───────────────────
                  *BLUE🔷LOCK*`);
                }

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
