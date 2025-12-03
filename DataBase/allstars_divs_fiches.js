const { Sequelize, DataTypes, Op } = require('sequelize');
const config = require('../set');
const db = config.DATABASE;

let sequelize;

if (!db) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.db',
    logging: false,
  });
} else {
  sequelize = new Sequelize(db, {
    dialect: 'postgres',
    ssl: true,
    protocol: 'postgres',
    dialectOptions: {
      native: true,
      ssl: { require: true, rejectUnauthorized: false },
    },
    logging: false,
  });
}

/* -----------------------------------------------------------------------
   🔥 MODELE AVEC ID SERIAL PRIMARY KEY + jid="aucun"
------------------------------------------------------------------------*/
const AllStarsDivsFiche = sequelize.define('AllStarsDivsFiche', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true  // SERIAL en Postgres
  },
  pseudo: { type: DataTypes.STRING, defaultValue: 'aucun' },
  classement: { type: DataTypes.STRING, defaultValue: 'aucun' },
  niveu_xp: { type: DataTypes.INTEGER, defaultValue: 1 },
  division: { type: DataTypes.STRING, defaultValue: 'aucun' },
  rang: { type: DataTypes.STRING, defaultValue: 'aucun' },
  classe: { type: DataTypes.STRING, defaultValue: 'aucun' },
  saison_pro: { type: DataTypes.INTEGER, defaultValue: 0 },
  golds: { type: DataTypes.INTEGER, defaultValue: 0 },
  fans: { type: DataTypes.INTEGER, defaultValue: 0 },
  archetype: { type: DataTypes.STRING, defaultValue: 'aucun' },
  commentaire: { type: DataTypes.TEXT, defaultValue: 'aucun' },
  victoires: { type: DataTypes.INTEGER, defaultValue: 0 },
  defaites: { type: DataTypes.INTEGER, defaultValue: 0 },
  championnants: { type: DataTypes.INTEGER, defaultValue: 0 },
  neo_cup: { type: DataTypes.INTEGER, defaultValue: 0 },
  evo: { type: DataTypes.INTEGER, defaultValue: 0 },
  grandslam: { type: DataTypes.INTEGER, defaultValue: 0 },
  tos: { type: DataTypes.INTEGER, defaultValue: 0 },
  the_best: { type: DataTypes.INTEGER, defaultValue: 0 },
  laureat: { type: DataTypes.INTEGER, defaultValue: 0 },
  sigma: { type: DataTypes.INTEGER, defaultValue: 0 },
  neo_globes: { type: DataTypes.INTEGER, defaultValue: 0 },
  golden_boy: { type: DataTypes.INTEGER, defaultValue: 0 },
  cleans: { type: DataTypes.INTEGER, defaultValue: 0 },
  erreurs: { type: DataTypes.INTEGER, defaultValue: 0 },
  note: { type: DataTypes.INTEGER, defaultValue: 0 },
  talent: { type: DataTypes.INTEGER, defaultValue: 0 },
  intelligence: { type: DataTypes.INTEGER, defaultValue: 0 },
  speed: { type: DataTypes.INTEGER, defaultValue: 0 },
  close_fight: { type: DataTypes.INTEGER, defaultValue: 0 },
  attaques: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_cards: { type: DataTypes.INTEGER, defaultValue: 0 },
  cards: { type: DataTypes.TEXT, defaultValue: 'aucune' },
  source: { type: DataTypes.STRING, defaultValue: 'inconnu' },

  // 🔥 Par défaut → "aucun"
  jid: { type: DataTypes.STRING, defaultValue: 'aucun' },

  oc_url: { type: DataTypes.STRING, defaultValue: 'https://files.catbox.moe/4quw3r.jpg' },
  code_fiche: { type: DataTypes.STRING, defaultValue: 'aucun' },

}, {
  tableName: 'allstars_divs_fiches',
  timestamps: false,
});

/* -----------------------------------------------------------------------
   🔥 FONCTIONS DE RÉPARATION DES IDS DUPLIQUÉS / JID NULL
------------------------------------------------------------------------*/

/** 🔥 Supprimer toutes les fiches dont jid est null, "null", "", undefined */
async function deleteNullJid() {
  const deleted = await AllStarsDivsFiche.destroy({
    where: {
      jid: {
        [Op.or]: [null, "null", "", " ", "aucun"]
      }
    }
  });

  console.log(`🗑️ ${deleted} fiches avec jid null supprimées.`);
}

/** 🔥 Corrige les ID dupliqués en réassignant un ID libre */
async function fixDuplicateIds() {
  const fiches = await AllStarsDivsFiche.findAll({ order: [['id', 'ASC']] });

  const usedIds = new Set();
  let maxId = 0;

  for (const fiche of fiches) {
    if (usedIds.has(fiche.id)) {
      maxId++;
      await fiche.update({ id: maxId });
      console.log(`⚠️ ID dupliqué corrigé : nouvel id = ${maxId}`);
    } else {
      usedIds.add(fiche.id);
      if (fiche.id > maxId) maxId = fiche.id;
    }
  }

  console.log("🔧 Tous les IDs dupliqués ont été réparés.");
}

/** 🔥 Réorganise les ID en 1,2,3,4,... */
async function fixPrimaryKeys() {
  const fiches = await AllStarsDivsFiche.findAll({ order: [['id', 'ASC']] });

  let newId = 1;
  for (const fiche of fiches) {
    if (fiche.id !== newId) {
      await fiche.update({ id: newId });
    }
    newId++;
  }

  console.log("🔧 IDs réorganisés proprement.");
}

/* -----------------------------------------------------------------------
   🔥 SYNCHRO + AUTO-FIX AU DÉMARRAGE
------------------------------------------------------------------------*/
(async () => {
  await AllStarsDivsFiche.sync();

  await deleteNullJid();      // supprime les jids nuls
  await fixDuplicateIds();    // corrige les ids dupliqués
  await fixPrimaryKeys();     // range les ids proprement

  console.log("✅ Base AllStarsDivsFiche 100% réparée et synchronisée.");
})();

/* -----------------------------------------------------------------------
   🔥 FONCTIONS UTILISATEUR
------------------------------------------------------------------------*/
async function getAllFiches() {
  return await AllStarsDivsFiche.findAll();
}

async function getData(where = {}) {
  const [fiche, created] = await AllStarsDivsFiche.findOrCreate({
    where,
    defaults: {}
  });

  if (created) console.log(`➕ Fiche créée :`, where);
  return fiche;
}

async function setfiche(colonne, valeur, jid) {
  const updateData = {};
  updateData[colonne] = valeur;

  const [updated] = await AllStarsDivsFiche.update(updateData, { where: { jid } });

  if (!updated) throw new Error(`❌ Aucun joueur trouvé pour jid : ${jid}`);
  console.log(`✔ ${colonne} mis à jour → ${valeur}`);
}

async function add_id(jid, data = {}) {
  if (!jid) throw new Error("JID requis");

  const exists = await AllStarsDivsFiche.findOne({ where: { jid } });
  if (exists) return null;

  return await AllStarsDivsFiche.create({ jid, ...data });
}

async function del_fiche(code_fiche) {
  return await AllStarsDivsFiche.destroy({
    where: { code_fiche }
  });
}

module.exports = {
  getAllFiches,
  setfiche,
  getData,
  add_id,
  del_fiche,
  deleteNullJid,
  fixDuplicateIds,
  fixPrimaryKeys
};
