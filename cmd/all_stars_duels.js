const { ovlcmd } = require("../lib/ovlcmd");

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
                 *AS JUMP🌀BATTLE ARENA🔅*`;
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

// ─── FONCTION AUTOMATIQUE POUR LES PAVÉS ⚡RAZORX™ ───

function parseStatsRazorX(text) {
    const blocMatch = text.match(/📊`Stats`:\s*([\s\S]+)/i);
    if (!blocMatch) return [];

    const lignes = blocMatch[1]
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    const actions = [];

    for (const ligne of lignes) {
        const [joueur, statsStr] = ligne.split(':').map(s => s.trim());
        if (!joueur || !statsStr) continue;

        const stats = statsStr.split(',').map(s => s.trim());

        for (const st of stats) {
            const m = st.match(/(pv|sta|energie)\s*([+-])\s*(\d+)%/i);
            if (!m) continue;

            actions.push({
                joueur,
                stat: m[1].toLowerCase(),
                valeur: parseInt(m[3]) * (m[2] === '-' ? -1 : 1)
            });
        }
    }
    return actions;
}

// ─── ÉCOUTEUR GLOBAL AMÉLIORÉ POUR LES PAVÉS ⚡RAZORX™ ───
ovlcmd({
    nom: "razorx_auto",
    isfunc: true
}, async (ms_org, ovl, { texte, ms, repondre }) => {
    if (!texte) return;
    if (!texte.includes("⚡RAZORX™")) return;
    if (!texte.includes("📊`Stats`:")) return;

    const actions = parseStatsRazorX(texte);
    if (actions.length === 0) return;

    // Normalisation fonction pour ignorer majuscules et espaces
    const normalize = str => str.toLowerCase().replace(/\s+/g, '');

    // Trouver le duel correspondant
    const duelKey = Object.keys(duelsEnCours).find(k =>
        actions.some(a => normalize(k).includes(normalize(a.joueur)))
    );
    if (!duelKey) return;

    const duel = duelsEnCours[duelKey];

    // Appliquer les modifications de stats
    for (const act of actions) {
        const joueur =
            duel.equipe1.find(j => normalize(j.nom) === normalize(act.joueur)) ||
            duel.equipe2.find(j => normalize(j.nom) === normalize(act.joueur));

        if (!joueur) continue;

        limiterStats(joueur.stats, act.stat, act.valeur);
    }

    // Renvoi automatique de la fiche duel mise à jour
    const fiche = generateFicheDuel(duel);
    await ovl.sendMessage(
        ms_org,
        { image: { url: duel.arene.image }, caption: fiche },
        { quoted: ms }
    );
});
