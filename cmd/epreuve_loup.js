const { ovlcmd } = require('../lib/ovlcmd');
const fs = require('fs');

// État global pour suivre les épreuves en cours
const epreuveState = new Map();

ovlcmd({
  nom_cmd: 'exercice4',
  classe: 'BLUE_LOCK⚽',
  react: '⚽',
  desc: 'Lance l\'épreuve du loup - Jeu de tir au but avec transfert de rôle'
}, async (ms_org, ovl, { repondre, auteur_Message, ms }) => {
  try {
    // Vérification des salons autorisés
    const authorizedChats = [
      '120363024647909493@g.us',
      '120363307444088356@g.us',
      '22651463203@s.whatsapp.net',
      '22605463559@s.whatsapp.net'
    ];
    if (!authorizedChats.includes(ms_org)) return repondre("Commande non autorisée pour ce chat.");

    // Envoi du GIF initial
    await ovl.sendMessage(ms_org, {
      video: { url: 'https://files.catbox.moe/xyzu123.gif' }, // Remplacez par votre URL
      gifPlayback: true
    }, { quoted: ms });

    // Envoi du message avec image
    const initialMessage = `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░
Dans cette épreuve l'objectif est de toucher un autre joueur avec le ballon⚽ en lui tirant dessus ! Après 20 mins le joueur qui sera le loup est éliminé❌.
⚠Au départ le loup est au milieu et les joueurs sont à 3m, le loup doit juste taguer le joueur qu'il vise ! le joueur le plus faible dans la pièce commence comme étant le loup, les joueurs n'ont que deux actions: esquiver le ballon et courir pour s'écarter du loup de 5m max et le loup ne peut que conduire la balle pour se rapprocher et tirer sur un joueur(juste taguer vers qui on avance et tirer sur lui, la cible doit juste dire s'il court quand le loup avance où s'il réagit au tir en esquivant juste, le loup n'a donc pas besoin de faire des pivots) . Vous ne pouvez que courir une fois sur deux tirs, donc si vous courez deux fois de suite❌ vous êtes le nouveau loup. Le loup a plus de chances de toucher un joueur dans à moins de 5m, toucher un joueur ayant un Ranking trop élevé que vous est difficile il est donc plus facile de toucher un joueur ayant un Ranking plus faible où proche de vous, le Ranking de base est défini par le niveau de puissance⏫.

⚽ Voulez vous lancer l'épreuve ?⌛ 
✅ Oui
❌ Non

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`;

    await ovl.sendMessage(ms_org, {
      image: { url: 'https://files.catbox.moe/abcd456.jpg' }, // Remplacez par votre URL
      caption: initialMessage
    }, { quoted: ms });

    // Attente de la réponse
    const getConfirmation = async (attempt = 1) => {
      if (attempt > 3) throw new Error('Trop de tentatives');
      const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
      const response = rep?.message?.extendedTextMessage?.text || rep?.message?.conversation;
      
      if (response?.toLowerCase() === 'non') {
        await ovl.sendMessage(ms_org, {
          image: { url: 'https://files.catbox.moe/abcd456.jpg' },
          caption: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

❌Lancement de l'épreuve annulé
       
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
      ⚽BLUE🔷LOCK`
        }, { quoted: ms });
        return false;
      }
      
      if (response?.toLowerCase() === 'oui') {
        await ovl.sendMessage(ms_org, {
          image: { url: 'https://files.catbox.moe/abcd456.jpg' },
          caption: `🔷 ⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

✅SUCCÈS: Veuillez taguer le loup pour lancer la partie

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
      ⚽BLUE🔷LOCK`
        }, { quoted: ms });
        return true;
      }
      
      await repondre('❓ Veuillez répondre par Oui ou Non.');
      return await getConfirmation(attempt + 1);
    };

    const confirmed = await getConfirmation();
    if (!confirmed) return;

    // Attente du tag du loup
    await ovl.sendMessage(ms_org, {
      video: { url: 'https://files.catbox.moe/efgh789.gif' }, // Remplacez par votre URL
      caption: 'En attente du tag du loup...',
      gifPlayback: true
    }, { quoted: ms });

    const getLoupTag = async (attempt = 1) => {
      if (attempt > 3) throw new Error('Trop de tentatives pour taguer le loup');
      const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 120000 });
      const message = rep?.message;
      
      if (!message) {
        await repondre('❌ Aucun tag reçu. Veuillez taguer le joueur qui sera le loup.');
        return await getLoupTag(attempt + 1);
      }
      
      // Extraction du tag (mention)
      let loupTag = '';
      if (message.extendedTextMessage && message.extendedTextMessage.contextInfo && message.extendedTextMessage.contextInfo.mentionedJid) {
        loupTag = message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      
      if (!loupTag) {
        await repondre('❌ Format incorrect. Veuillez taguer un joueur avec @.');
        return await getLoupTag(attempt + 1);
      }
      
      return loupTag;
    };

    const loupTag = await getLoupTag();
    
    // Démarrage de l'épreuve
    await ovl.sendMessage(ms_org, {
      video: { url: 'https://files.catbox.moe/ijk012.gif' }, // Remplacez par votre URL
      caption: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

⚽DÉBUT DE L'ÉPREUVE
> @${loupTag.split('@')[0]} vous êtes désormais le loup, vous avez 20min avant de vous faire éliminer. Passer le titre de loup à un autre joueur pour réussir l'épreuve. BONNE CHANCE !

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`,
      gifPlayback: true
    }, { quoted: ms });

    // Initialisation de l'état de l'épreuve
    epreuveState.set(ms_org, {
      loup: loupTag,
      startTime: Date.now(),
      timer: null,
      interval: null,
      lastLoup: loupTag
    });

    // Décompte de 20 minutes
    const startEpreuve = async () => {
      const state = epreuveState.get(ms_org);
      if (!state) return;
      
      const endTime = state.startTime + 20 * 60 * 1000; // 20 minutes
      
      // Rappel toutes les 5 minutes
      state.interval = setInterval(async () => {
        const remaining = Math.ceil((endTime - Date.now()) / (60 * 1000));
        if (remaining <= 0) {
          clearInterval(state.interval);
          return;
        }
        
        if (remaining % 5 === 0) {
          await ovl.sendMessage(ms_org, {
            caption: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

⏰ RAPPEL: Il reste ${remaining} minutes avant la fin de l'épreuve. Le loup actuel est @${state.loup.split('@')[0]}

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`
          }, { quoted: ms });
        }
      }, 60 * 1000); // Vérifier toutes les minutes
      
      // Timer de fin
      state.timer = setTimeout(async () => {
        const finalState = epreuveState.get(ms_org);
        if (!finalState) return;
        
        await ovl.sendMessage(ms_org, {
          video: { url: 'https://files.catbox.moe/lmn345.gif' }, // Remplacez par votre URL
          caption: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

⚽FIN DE L'ÉPREUVE
> Joueur @${finalState.lastLoup.split('@')[0]} tu es éliminé❌
       
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`,
          gifPlayback: true
        }, { quoted: ms });
        
        // Nettoyage
        clearInterval(finalState.interval);
        epreuveState.delete(ms_org);
      }, 20 * 60 * 1000); // 20 minutes
    };

    startEpreuve();

    // Écoute des messages pendant l'épreuve
    const listenForEvents = async () => {
      const state = epreuveState.get(ms_org);
      if (!state) return;
      
      try {
        const rep = await ovl.recup_msg({ 
          auteur: auteur_Message, 
          ms_org, 
          temps: 20 * 60 * 1000 // 20 minutes
        });
        
        const message = rep?.message;
        if (!message) return;
        
        const text = message.extendedTextMessage?.text || message.conversation || '';
        
        // Vérifier l'arrêt de l'épreuve
        if (text.toLowerCase().includes('arrêt épreuve')) {
          const currentState = epreuveState.get(ms_org);
          if (currentState) {
            clearTimeout(currentState.timer);
            clearInterval(currentState.interval);
            epreuveState.delete(ms_org);
            
            await ovl.sendMessage(ms_org, {
              caption: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

⏹️ ÉPREUVE ARRÊTÉE MANUELLEMENT
       
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`
            }, { quoted: ms });
          }
          return;
        }
        
        // Vérifier si c'est une fiche de transfert
        if (text.includes('*⚽Loup*=') && text.includes('*⚽Cible*=')) {
          await processTransfert(ms_org, ovl, ms, text, state);
        }
        
        // Continuer à écouter
        listenForEvents();
      } catch (error) {
        console.error('Erreur écoute événements:', error);
      }
    };
    
    listenForEvents();

  } catch (e) {
    console.error('Erreur épreuve du loup:', e.message);
    repondre("❌ Une erreur est survenue lors de l'épreuve.");
  }
});

// Fonction pour traiter un transfert de loup
async function processTransfert(ms_org, ovl, ms, text, state) {
  try {
    // Extraction des données de la fiche
    const loupMatch = text.match(/\*⚽Loup\*=\s*(\d+)/);
    const cibleMatch = text.match(/\*⚽Cible\*=\s*(\d+)/);
    const viseMatch = text.match(/\*⚽Visé\*=\s*@([\w\d]+)/);
    const distanceMatch = text.match(/\*⚽Distance\*=\s*(\d+)m/);
    
    if (!loupMatch || !cibleMatch || !viseMatch || !distanceMatch) {
      await ovl.sendMessage(ms_org, {
        caption: "❌ Format de fiche incorrect. Utilisez le format spécifié."
      }, { quoted: ms });
      return;
    }
    
    const loupValue = parseInt(loupMatch[1]);
    const cibleValue = parseInt(cibleMatch[1]);
    const viseTag = viseMatch[1];
    const distance = parseInt(distanceMatch[1]);
    
    // Calcul de la probabilité
    const probabilite = calculerProbabilite(loupValue, cibleValue, distance);
    const reussi = Math.random() < probabilite;
    
    // Mise à jour de l'état si réussi
    if (reussi) {
      state.loup = viseTag + '@s.whatsapp.net'; // Format standard JID
      state.lastLoup = state.loup;
      
      await ovl.sendMessage(ms_org, {
        video: { url: 'https://files.catbox.moe/opq678.gif' }, // Remplacez par votre URL
        caption: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

*✅TOUCHÉ !*
> Joueur @${viseTag} tu es le nouveau loup! Veuillez toucher un joueur avant la fin de l'épreuve⌛

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`,
        gifPlayback: true
      }, { quoted: ms });
    } else {
      await ovl.sendMessage(ms_org, {
        video: { url: 'https://files.catbox.moe/rst901.gif' }, // Remplacez par votre URL
        caption: `🔷⚽ÉPREUVE DU LOUP🥅
▔▔▔▔▔▔▔▔▔▔▔▔▔░▒▒▒▒░░▒░

*❌RATÉ !*
> Joueur @${state.loup.split('@')[0]} toujours le loup! Veuillez toucher un joueur avant la fin de l'épreuve⌛

▔▔▔▔▔▔▔▔▔▔▔▔▔▔▱▱▱▔▔
     ⚽BLUE🔷LOCK`,
        gifPlayback: true
      }, { quoted: ms });
    }
  } catch (error) {
    console.error('Erreur traitement transfert:', error);
    await ovl.sendMessage(ms_org, {
      caption: "❌ Erreur lors du traitement du transfert."
    }, { quoted: ms });
  }
}

// Fonction pour calculer la probabilité de réussite
function calculerProbabilite(loup, cible, distance) {
  const difference = loup - cible;
  const isProche = distance <= 5;
  
  if (difference > 5) {
    return isProche ? 0.9 : 1.0;
  } else if (difference > 0) {
    return isProche ? 0.7 : 0.8;
  } else if (difference === 0) {
    return isProche ? 0.5 : 0.6;
  } else if (difference > -5) {
    return isProche ? 0.3 : 0.35;
  } else {
    return isProche ? 0.05 : 0.1;
  }
}
