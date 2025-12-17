const { ovlcmd } = require("../lib/ovlcmd");
const { getData, setfiche, createFiche } = require("../DataBase/allstars_divs_fiches");

const arenes = [
    { nom: 'Desert Montagneux⛰️', image: 'https://files.catbox.moe/aoximf.jpg' },
    { nom: 'Ville en Ruines🏚️', image: 'https://files.catbox.moe/2qmvpa.jpg' },
    { nom: 'Centre-ville🏙️', image: 'https://files.catbox.moe/pzlkf9.jpg' },
    { nom: 'Arise🌇', image: 'https://files.catbox.moe/3vlsmw.jpg' },
    { nom: 'Salle du temps ⌛', image: 'https://files.catbox.moe/j4e1pp.jpg' },
    { nom: 'Valley de la fin🗿', image: 'https://files.catbox.moe/m0k1jp.jpg' },
    { nom: 'École d\'exorcisme de Tokyo📿', image: 'https://files.catbox.moe/rgznzb.jpg' },
    { nom: 'Marinford🏰', image: 'https://files.catbox.moe/4bygut.jpg' },
    { nom: 'Cathédrale⛩️', image: 'https://files.catbox.moe/ie6jvx.jpg' }
];

const duelsEnCours = {};
let lastArenaIndex = -1;

function tirerAr() {
    let index;
    do {
        index = Math.floor(Math.random() * arenes.length);
    } while (index === lastArenaIndex);
    lastArenaIndex = index;
    return arenes[index];
}

function limiterStats(stats, stat, valeur) {
    if (stats[stat] === 100 && valeur > 0) {
        return { stats, message: '⚠️ Stats déjà au maximum !' };
    }
    stats[stat] = Math.min(stats[stat] + valeur, 100);
    return { stats, message: null };
}

function generateFicheDuel(duel) {
    return `*🆚VERSUS ARENA BATTLE🏆🎮*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒░░▒░
🔅 *${duel.equipe1[0].nom}*: 🫀:${duel.equipe1[0].stats.sta}% 🌀:${duel.equipe1[0].stats.energie}% ❤️:${duel.equipe1[0].stats.pv}%
                                   ~  *🆚*  ~
🔅 *${duel.equipe2[0].nom}*: 🫀:${duel.equipe2[0].stats.sta}% 🌀:${duel.equipe2[0].stats.energie}% ❤️:${duel.equipe2[0].stats.pv}%
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*🌍 𝐀𝐫𝐞̀𝐧𝐞*: ${duel.arene.nom}
*🚫 𝐇𝐚𝐧𝐝𝐢𝐜𝐚𝐩𝐞*: Boost 1 fois chaque 2 tours!
*⚖️ 𝐒𝐭𝐚𝐭𝐬*: ${duel.statsCustom || "Aucune"}
*🏞️ 𝐀𝐢𝐫 𝐝𝐞 𝐜𝐨𝐦𝐛𝐚𝐭*: illimitée
*🦶🏼 𝐃𝐢𝐬𝐭𝐚𝐧𝐜𝐞 𝐢𝐧𝐢𝐭𝐢𝐚𝐥𝐞 📌*: 5m
*⌚ 𝐋𝐚𝐭𝐞𝐧𝐜𝐞*: 6mins ⚠️
*⭕ 𝐏𝐨𝐫𝐭𝐞́𝐞*: 10m
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔

*⚠️ Vous avez 🔟 tours max pour finir votre Adversaire !*
*Sinon la victoire sera donnée par décision selon l'offensive !*

╰───────────────────
🏆NSL PRO ESPORT ARENA® | RAZORX⚡™ `;
}

ovlcmd({
    nom_cmd: "duel",
    classe: "Duel",
    react: "⚔️",
    desc: "Lance un duel entre deux joueurs."
}, async (ms_org, ovl, { arg, repondre, ms }) => {
    if (!arg[0]) return repondre('Format: +duel joueur1 vs joueur2 / stats');

    try {
        const input = arg.join(' ');
        const [joueursInput, statsCustom] = input.split('/').map(p => p.trim());
        const [equipe1Str, equipe2Str] = joueursInput.split('vs').map(p => p.trim());

        if (!equipe1Str || !equipe2Str) return repondre('❌ Erreur de format !');

        const equipe1 = equipe1Str.split(',').map(n => ({ nom: n.trim(), stats: { sta: 100, energie: 100, pv: 100 } }));
        const equipe2 = equipe2Str.split(',').map(n => ({ nom: n.trim(), stats: { sta: 100, energie: 100, pv: 100 } }));
        const areneT = tirerAr();

        const duelKey = `${equipe1Str} vs ${equipe2Str}`;
        duelsEnCours[duelKey] = { equipe1, equipe2, statsCustom: statsCustom || 'Aucune stat personnalisée', arene: areneT };

        const fiche = generateFicheDuel(duelsEnCours[duelKey]);
        await ovl.sendMessage(ms_org, {
          video: { url: 'https://files.catbox.moe/dye6xo.mp4' },
          gifPlayback: true,
          caption: `
 🌀Préparation de match...`
        }, { quoted: ms });
        await ovl.sendMessage(ms_org, { image: { url: areneT.image }, caption: fiche }, { quoted: ms });
    } catch (e) {
        console.error(e);
        repondre('❌ Une erreur est survenue.');
    }
});

ovlcmd({
    nom: "duel stats",
    isfunc: true
}, async (ms_org, ovl, { texte, repondre, ms, getJid }) => {
    if(!texte) return;
    const mots = texte.trim().split(/\s+/);
    const statsAutorisees = ["sta", "energie", "pv"];

    if (mots.length !== 4) return;
    let [joueurId, stat, signe, valeurStr] = mots;

    if (!statsAutorisees.includes(stat.toLowerCase())) return;
    if (!["+", "-"].includes(signe)) return;

    const valeur = parseInt(valeurStr);
    if (isNaN(valeur)) return;

    if (joueurId.startsWith("@")) {
    joueurId = joueurId.replace("@", "");
    }

    const duelKey = Object.keys(duelsEnCours).find(k => k.includes(joueurId));
    if (!duelKey) return;

    const duel = duelsEnCours[duelKey];
    const joueur = duel.equipe1.find(j => j.nom === joueurId) || duel.equipe2.find(j => j.nom === joueurId);
    if (!joueur) return;

    const { stats, message } = limiterStats(joueur.stats, stat.toLowerCase(), (signe === "-" ? -valeur : valeur));
    joueur.stats = stats;

    if (message) await repondre(message);

    const fiche = generateFicheDuel(duel);
    await ovl.sendMessage(ms_org, { image: { url: duel.arene.image }, caption: fiche }, { quoted: ms });
});


ovlcmd({
    nom_cmd: "reset_stats",
    classe: "Duel",
    react: "🔄",
    desc: "Réinitialise les stats d’un joueur ou de tous."
}, async (ms_org, ovl, { arg, repondre, ms }) => {
    if (arg.length < 1) return repondre('Format: @NomDuJoueur ou "all"');

    const joueurId = arg[0];
    const duelKey = Object.keys(duelsEnCours).find(k => k.includes(joueurId.replace("@", "")));
    if (!duelKey) return repondre('❌ Joueur non trouvé.');

    const duel = duelsEnCours[duelKey];

    if (joueurId.toLowerCase() === 'all') {
        duel.equipe1.forEach(j => j.stats = { sta: 100, energie: 100, pv: 100 });
        duel.equipe2.forEach(j => j.stats = { sta: 100, energie: 100, pv: 100 });
    } else {
        const joueur = duel.equipe1.find(j => j.nom === joueurId.replace("@", "")) || duel.equipe2.find(j => j.nom === joueurId.replace("@", ""));
        if (!joueur) return repondre('❌ Joueur non trouvé.');
        joueur.stats = { sta: 100, energie: 100, pv: 100 };
    }

    const fiche = generateFicheDuel(duel);
    ovl.sendMessage(ms_org, { image: { url: duel.arene.image }, caption: fiche }, { quoted: ms });
});

ovlcmd({
    nom_cmd: "reset_duel",
    classe: "Duel",
    react: "🗑️",
    desc: "Supprime un duel en cours."
}, async (ms_org, ovl, { arg, repondre, auteur_Message, ms }) => {
    if (arg.length < 1) return repondre('Format: @NomDuJoueur ou "all"');

    const joueurId = arg[0];
    await ovl.sendMessage(ms_org, { text: '❓ Confirmez la suppression avec "oui" ou "non".' }, { quoted: ms });

    const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
    const confirmation = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation;

    if (!rep || confirmation.toLowerCase() !== 'oui') return repondre('❌ Suppression annulée.');

    if (joueurId.toLowerCase() === 'all') {
        const n = Object.keys(duelsEnCours).length;
        if (n === 0) return repondre('Aucun duel en cours.');
        Object.keys(duelsEnCours).forEach(k => delete duelsEnCours[k]);
        return repondre(`✅ Tous les duels (${n}) ont été supprimés.`);
    }

    const duelKey = Object.keys(duelsEnCours).find(k => k.includes(joueurId.replace("@", "")));
    if (!duelKey) return repondre('❌ Aucun duel trouvé.');
    delete duelsEnCours[duelKey];
    repondre(`✅ Duel "${duelKey}" supprimé.`);
});


// ─────────────────────────────────────────────
// ⚡ RAZORX™ — PARSER STATS
// ─────────────────────────────────────────────
function parseStatsRazorX(text) {
    const blocMatch = text.match(/📊`Stats`:\s*([\s\S]+)/i);
    if (!blocMatch) return [];

    const lignes = blocMatch[1]
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    const actions = [];

    for (const ligne of lignes) {
        const clean = ligne.replace(/[\u2066-\u2069]/g, '');
        const [playerPart, statsStr] = clean.split(':').map(s => s.trim());
        if (!playerPart || !statsStr) continue;

        // 🔥 accepte @Damian OU damian
        const tag = playerPart.startsWith("@")
            ? playerPart.replace("@", "")
            : playerPart;

        const stats = statsStr.split(',').map(s => s.trim());

        for (const st of stats) {
            const m = st.match(
                /(pv|sta|energie|speed|talent|strikes|attaques)\s*([+-])\s*(\d+)/i
            );
            if (!m) continue;

            actions.push({
                raw: playerPart, // garde l’info
                tag,
                isMention: playerPart.startsWith("@"),
                stat: m[1].toLowerCase(),
                valeur: parseInt(m[3]) * (m[2] === "-" ? -1 : 1)
            });
        }
    }
    return actions;
}

// ─────────────────────────────────────────────
// ⚡ RAZORX™ — ÉCOUTEUR GLOBAL
// ─────────────────────────────────────────────
ovlcmd({
    nom: "razorx_auto",
    isfunc: true
}, async (ms_org, ovl, { texte, ms, getJid }) => {

    if (!texte?.includes("⚡RAZORX™")) return;

    let duel = null;
    const allStarsConfirm = [];

    // ───────────────── STATS
    if (texte.includes("📊`Stats`:")) {
        const actions = parseStatsRazorX(texte);
        if (actions.length) {

            const duelKey = Object.keys(duelsEnCours).find(k =>
                actions.some(a => k.toLowerCase().includes(a.tag.toLowerCase()))
            );
            duel = duelKey ? duelsEnCours[duelKey] : null;

            for (const act of actions) {
                let jid;
                try {
                    jid = await getJid(act.tag + "@lid", ms_org, ovl);
                } catch { continue; }

                // DUEL
                if (['pv', 'sta', 'energie'].includes(act.stat)) {
                    if (!duel) continue;
                    const joueur =
                        duel.equipe1.find(j => j.nom.toLowerCase() === act.tag.toLowerCase()) ||
                        duel.equipe2.find(j => j.nom.toLowerCase() === act.tag.toLowerCase());
                    if (!joueur) continue;
                    limiterStats(joueur.stats, act.stat, act.valeur);
                }

                // ALL STARS
                if (['speed', 'talent', 'strikes', 'attaques'].includes(act.stat)) {
                    const data = await getData({ jid });
                    if (!data) continue;
                    const oldVal = Number(data[act.stat]) || 0;
                    await setfiche(act.stat, oldVal + act.valeur, jid);
                    allStarsConfirm.push(`${act.stat} (${act.valeur > 0 ? '+' : ''}${act.valeur}) → @${act.tag}`);
                }
            }
        }
    }

    // ───────────────── RESULTAT
    if (texte.includes("🏆`RESULTAT`")) {
        const result = parseResultRazorX(texte);
        if (result) {
            let winnerJid, loserJid;
            try {
                winnerJid = await getJid(result.winner + "@lid", ms_org, ovl);
                loserJid  = await getJid(result.loser + "@lid", ms_org, ovl);
            } catch { return; }

            const winnerData = await getData({ jid: winnerJid });
            const loserData  = await getData({ jid: loserJid });
            if (!winnerData || !loserData) return;

            // WINNER
            await setfiche("victoire", (Number(winnerData.victoire) || 0) + 1, winnerJid);
            await setfiche("fans", (Number(winnerData.fans) || 0) + 1000, winnerJid);
            await setfiche("talent", (Number(winnerData.talent) || 0) + 1, winnerJid);

            // LOSER
            await setfiche("defaite", (Number(loserData.defaite) || 0) + 1, loserJid);
            await setfiche("fans", (Number(loserData.fans) || 0) - 600, loserJid);
            await setfiche("talent", (Number(loserData.talent) || 0) - 1, loserJid);
        }
    }

    // ───────────────── ENVOI FICHE DUEL
    if (duel) {
        await ovl.sendMessage(
            ms_org,
            { image: { url: duel.arene.image }, caption: generateFicheDuel(duel) },
            { quoted: ms }
        );
    }

    // ───────────────── CONFIRMATION ALL STARS
    if (allStarsConfirm.length) {
        await ovl.sendMessage(ms_org, {
            text: "✅ stats All Stars mises à jour." 
        });
    }

});

// Nettoyage pseudo WhatsApp (IDENTIQUE À STATS)
function cleanPlayerName(name) {
    return name
        .replace(/@/g, "")
        .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
        .trim();
}
// Parser RESULTAT aligné sur le pavé RAZORX⚡™
function parseResultRazorX(text) {
    const clean = text
        .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
        .replace(/\r/g, "");

    const winner = clean.match(/winner\s*:/i);
    const loser  = clean.match(/loser\s*:/i);
    const duree  = clean.match(/durée\s*:\s*(\d+)/i);

    if (!winner || !loser || !duree) return null;

    return {
        duree: parseInt(duree[1], 10)
    };
}

// ÉCOUTEUR RAZORX⚡™ RESULTAT FINAL 
ovlcmd({
    nom: "razorx_result",
    isfunc: true
}, async (ms_org, ovl, { texte, ms }) => {

    if (!texte?.includes("⚡RAZORX™")) return;
    if (!texte.includes("🏆`RESULTAT`")) return;

    const result = parseResultRazorX(texte);
    if (!result) return;

    const mentioned =
        ms?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    // ❌ sécurité
    if (mentioned.length < 2) {
        console.log("❌ JID manquant dans RESULTAT");
        return;
    }

    const winnerJid = mentioned[0];
    const loserJid  = mentioned[1];

    const winnerData = await getData({ jid: winnerJid });
    const loserData  = await getData({ jid: loserJid });
    if (!winnerData || !loserData) return;

    // 🏆 WINNER
    await setfiche("victoire", (Number(winnerData.victoire) || 0) + 1, winnerJid);
    await setfiche("fans", (Number(winnerData.fans) || 0) + 1000, winnerJid);
    await setfiche("talent", (Number(winnerData.talent) || 0) + 1, winnerJid);
    await setfiche("niveau", capLevel((Number(winnerData.niveau) || 0) + 1), winnerJid);

    // ❌ LOSER
    await setfiche("defaite", (Number(loserData.defaite) || 0) + 1, loserJid);
    await setfiche("fans", (Number(loserData.fans) || 0) - 600, loserJid);
    await setfiche("talent", (Number(loserData.talent) || 0) - 1, loserJid);
    await setfiche("niveau", capLevel((Number(loserData.niveau) || 0) - 1), loserJid);

    // ⏱️ KO RAPIDE
    if (result.duree <= 3) {
        await setfiche(
            "niveau",
            capLevel((Number(loserData.niveau) || 0) - 1),
            loserJid
        );
    }

    await ovl.sendMessage(ms_org, {
        text: "🏆 RAZORX™ — Résultat appliqué (JID WhatsApp confirmé)."
    }, { quoted: ms });
}); 
