const { ovlcmd } = require("../lib/ovlcmd");
const { getData, setfiche } = require('../DataBase/allstars_divs_fiches');

function normalizeText(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function add_fiche(nom_joueur, data_id, image_oc) {
    ovlcmd(
  {
    nom_cmd: nom_joueur,
    classe: joueur_div,
    react: "✅"
  },
async (ms_org, ovl, cmd_options) => {
    const { repondre, ms, arg, prenium_id } = cmd_options;

            let client;

            try {
                const data = await getData(data_id);
                const [joueur, object, signe, valeur, ...texte] = arg;

                if (!arg.length) {
                    const fiche = `░▒▒░░▒░ *👤N E O P L A Y E R 🎮*
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
◇ *Pseudo👤*: ${data.pseudo}
◇ *Classement continental🌍:* ${data.classement}
◇ *Niveau XP⏫*:  ${data.niveu_xp} ⏫ 
◇ *Division🛡️*: ${data.division}
◇ *Rank 🎖️*: ${data.rang}
◇ *Classe🎖️*: ${data.classe}
◇ *Saisons Pro🏆*: ${data.saison_pro}
▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
◇ *Golds🧭*: ${data.golds} ©🧭
◇ *Fans👥*:  ${data.fans} 👥
◇ *Archetype ⚖️*: ${data.archetype} 
◇ *Commentaire*: ${data.commentaire}                
░▒░░ PALMARÈS🏆 
▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
 ✅Victoires: ${data.victoires} - ❌Défaites: ${data.defaites}
*◇🏆Championnats*: ${data.championnants}  
*◇🏆NEO cup💫*: ${data.neo_cup}
*◇🏆EVO💠*: ${data.evo}  
*◇🏆GrandSlam🅰️*: ${data.grandslam}
▔▔▔▔▔▔▔▔▔▔▔▔▔
*◇🌟TOS*: ${data.tos}    
*◇👑The BEST🏆*: ${data.the_best} 
*◇🎗️Laureat🏆*: ${data.laureat}  
*◇🗿Sigma🏆*: ${data.sigma}
*◇🎖️Neo Globes*: ${data.neo_globes} 
*◇🏵️Golden Boy🏆*: ${data.golden_boy}
▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
✅Cleans: ${data.cleans}
❌Erreurs: ${data.erreurs}
📈Note: ${data.note}/100
░▒░▒░ CITATION🫵🏻 
▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
> << ${data.citation} >>

░▒░▒░ STATS📊 
▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
⌬  Talent🧠 :     ▱▱▱▱▬▬▬ ${data.talent}
⌬  Puissance🏆: ▱▱▱▱▬▬▬ ${data.puissance}
⌬  Speed💬 :  ▱▱▱▱▬▬▬  ${data.speed}
⌬ Close combat👊🏻:  ▱▱▱▱▬▬▬ ${data.close_combat}
⌬ Attaques🌀:  ▱▱▱▱▬▬▬ ${data.attaques}

░▒░░▒░ CARDS🎴: ${data.total_cards}
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
᪣ ${data.cards}

▱▱▱▱ ▱▱▱▱ 
*⌬𝗡SL🏆*
> NEO SUPER LEAGUE ESPORTS ROLEPLAY™`;
                    ovl.sendMessage(ms_org, { image: { url: image_oc }, caption: fiche }, { quoted: ms });
                } else {
                    const proConfig = { connectionString: dbUrl, ssl: { rejectUnauthorized: false } };
                    const pool = new Pool(proConfig);
                    client = await pool.connect();

                    if (superUser) {
                        const updates = await processUpdates(arg, data_id, client);
                        await updatePlayerData(updates, client, data_id);

                        const messages = updates.map(update => `⚙ Object: ${update.object}\n💵 Ancienne Valeur: ${update.oldValue}\n💵 Nouvelle Valeur: ${update.newValue}`).join('\n\n');
                        await repondre(`Données du joueur mises à jour:\n\n${messages}`);
                    } else {
                        repondre('Seul les Membres de la NS peuvent modifier cette fiche');
                    }
                }
            } catch (error) {
                console.error("Erreur lors de la mise à jour:", error);
                repondre('Une erreur est survenue. Veuillez réessayer');
            } finally {
                if (client) client.release();
            }
        }
    );
}

async function processUpdates(arg, data_id, client) {
    const colonnesJoueur = {
        pseudo: "e1", division: "e2", classe: "e3", rang: "e4", golds: "e5", 
        neocoins: "e6", gift_box: "e7", coupons: "e8", np: "e9", talent: "e10",
        victoires: "e12", defaites: "e13", trophees: "e14", tos: "e15", awards: "e16",
        cards: "e17", globes: "e22", pos: "e23", talent: "e24", force: "e25", 
        close_combat: "e26", precision: "e27", speed: "e28"
    };

    const updates = [];
    let i = 0;

    while (i < arg.length) {
        const [object, signe, valeur] = [arg[i], arg[i+1], arg[i+2]];
        const colonneObjet = colonnesJoueur[object];
        let texte = [];
        i += 2;

        while (i < arg.length && !colonnesJoueur[arg[i]]) {
            texte.push(arg[i]);
            i++;
        }

        const { oldValue, newValue } = await calculateNewValue(colonneObjet, signe, valeur, texte, data_id, client);
        updates.push({ colonneObjet, newValue, oldValue, object, texte });
    }

    return updates;
}

async function calculateNewValue(colonneObjet, signe, valeur, texte, data_id, client) {
    const query = `SELECT ${colonneObjet} FROM westdiv WHERE id = ${data_id}`;
    const result = await client.query(query);
    const oldValue = result.rows[0][colonneObjet];
    let newValue;
    
    if (signe === '+' || signe === '-') {
        newValue = eval(`${oldValue} ${signe} ${valeur}`);
    } else if (signe === '=' || signe === 'add' || signe === 'supp') {
        if (signe === '=') newValue = texte.join(' ');
        else if (signe === 'add') newValue = oldValue + ' ' + texte.join(' ');
        else if (signe === 'supp') newValue = oldValue.replace(new RegExp(`\\b${normalizeText(texte.join(' '))}\\b`, 'gi'), '').trim();
    }

    return { oldValue, newValue };
}

async function updatePlayerData(updates, client, data_id) {
    await client.query('BEGIN');
    for (const update of updates) {
        const query = `UPDATE westdiv SET ${update.colonneObjet} = $1 WHERE id = ${data_id}`;
        await client.query(query, [update.newValue]);
    }
    await client.query('COMMIT');
}


//add_fiche(nom_joueur, data_id, image_oc)
//add_fiche('westvanitas👤', '1', 'https://files.catbox.moe/dueik1.jpg');
add_fiche('westnash👤', '2', 'https://files.catbox.moe/w4sso3.jpg');
add_fiche('westindra👤', '3', 'https://files.catbox.moe/dgkvph.jpg');
add_fiche('westaether👤', '4', 'https://files.catbox.moe/yjvd63.jpg');
//5
//add_fiche('westsolomoe👤', '6', 'https://files.catbox.moe/xvbz5o.jpg');
add_fiche('westsept👤', '7', 'https://files.catbox.moe/uev2zx.jpg');
//add_fiche('westtempest👤', '8', 'https://files.catbox.moe/u1v994.jpg');
add_fiche('westinferno👤', '9', 'https://files.catbox.moe/dv23bc.jpg');
add_fiche('westhajime👤', '10', 'https://files.catbox.moe/4pxl7h.jpg');
//add_fiche('westregulus👤', '11', 'https://telegra.ph/file/ffb64bf678bb1107cca18.jpg');

  
