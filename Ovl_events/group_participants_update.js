const { jidDecode } = require("@whiskeysockets/baileys");
const config = require('../set');

async function group_participants_update (data, ovl) {
    const parseID = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return (decode.user && decode.server && `${decode.user}@${decode.server}`) || jid;
        }
        return jid;
    };

    try {
         
        for (const participant of data.participants) {
            let profilePic;
            try {
                profilePic = await ovl.profilePictureUrl(participant, 'image');
            } catch (err) {
                console.error(err);
                profilePic = 'https://files.catbox.moe/54ip7g.jpg';
            }

            const userMention = `@${participant.split("@")[0]}`;

            if (data.action === 'add' && data.id == '120363031940789145@g.us' && config.WELCOME == 'oui') {
                const message = `🎉 🔷 *🎉WELCOME 𝗮̀ 🔷𝗡Ξ𝗢𝘃𝗲𝗿𝘀𝗲🎉* 🎮
░▒▒▒▒░░▒░▔▔▔▔▔▔▔▔▔▔▔▔▔
Bienvenue à vous *${userMention}* 😃💙👋🏻, ceci est le salon de Recrutement des nouveaux joueurs ! Une fois avoir lu et terminé les conditions d'intégration, vous serez ajoutés dans le Salon principal. #NEONation💙 #Welcome💙👋🏻🙂. 

🔷🎮 *𝖢𝖮𝖭𝖣𝖨𝖳𝖨𝖮𝖭𝖲 𝖭𝖤𝖮𝗏𝖾𝗋𝗌𝖾*
░▒▒▒▒░░▒░▔▔▔▔▔▔▔▔▔▔▔▔▔
❓Voici comment s'enregistrer à NEOverse👇🏼:

👉🏽 *ÉTAPE 1️⃣*: Votre Pseudo (Nom de joueur + Pays + Numéro de téléphone)
👉🏽 *ÉTAPE 2️⃣:* Envoyer une photo de profil de votre avatar (de préférence un perso anime comme Blue Lock, etc.). 
👉🏽 *ÉTAPE 3️⃣* : Follow les deux chaînes ci-dessous 
👉🏽 *ÉTAPE 4️⃣*: Attendez votre première carte de jeu avant de demander l'intégration : https://chat.whatsapp.com/LrKSRoxMcPi133sCtQB8Hf. 

*🌍NOS LIENS*👇👇👇
▔▔▔▔▔▔▔▔▔▔▔▔▔
👉🏽🪀 *Chaîne* : /whatsapp.com/channel/0029VaN9Z2yL2AU55DSahC23

👉🏽 *🛍️RP Store* : /whatsapp.com/channel/0029VaS9ngkFHWqAHps0BL3f

░░░░░░░░░░░░░░░░░░░
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
💙𝗡Ξ𝗢🙂🏆🎉`;
                await ovl.sendMessage(data.id, {
                    image: { url: profilePic },
                    caption: message,
                    mentions: [participant]
                });
            }
        }
    } catch (err) {
        console.error(err);
    }
};

module.exports = group_participants_update;
