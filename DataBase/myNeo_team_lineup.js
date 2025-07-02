const { Sequelize, DataTypes } = require('sequelize');
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

const MyNeo = sequelize.define('MyNeo', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  users: {
    type: DataTypes.STRING,
    defaultValue: 'aucun'
  },
  tel: {
    type: DataTypes.STRING,
    defaultValue: 'aucun'
  },
  points_jeu: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  nc: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  np: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  coupons: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  gift_box: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  all_stars: {
    type: DataTypes.STRING,
    defaultValue: 'aucun'
  },
  blue_lock: {
    type: DataTypes.STRING,
    defaultValue: '+Team⚽'
  },
  elysium: {
    type: DataTypes.STRING,
    defaultValue: '+ElysiumMe💠'
  }
}, {
  tableName: 'myneo',
  timestamps: false,
});

(async () => {
  await MyNeo.sync();
  console.log("✅ Table 'myneo' synchronisée avec succès.");
})();

// 📌 Fonctions utilitaires
async function getUserData(id) {
  try {
    return await MyNeo.findByPk(id);
  } catch (err) {
    console.error('❌ Erreur récupération utilisateur:', err);
    return null;
  }
}

async function saveUser(id, data = {}) {
  try {
    const exists = await MyNeo.findByPk(id);
    if (exists) return '⚠️ Ce joueur est déjà enregistré.';
    await MyNeo.create({ id, tel: id.replace('@s.whatsapp.net', ''), ...data });
    return '✅ Joueur enregistré avec succès.';
  } catch (err) {
    console.error('❌ Erreur enregistrement utilisateur:', err);
    return '❌ Une erreur est survenue lors de l\'enregistrement.';
  }
}

async function deleteUser(id) {
  try {
    const deleted = await MyNeo.destroy({ where: { id } });
    return deleted ? '✅ Joueur supprimé avec succès.' : '⚠️ Joueur introuvable.';
  } catch (err) {
    console.error('❌ Erreur suppression utilisateur:', err);
    return '❌ Une erreur est survenue lors de la suppression.';
  }
}

async function updateUser(id, updates) {
  try {
    const [updated] = await MyNeo.update(updates, { where: { id } });
    return updated ? '✅ Données mises à jour avec succès.' : '⚠️ Aucun champ mis à jour.';
  } catch (err) {
    console.error('❌ Erreur mise à jour utilisateur:', err);
    return '❌ Une erreur est survenue lors de la mise à jour.';
  }
}

module.exports = {
  MyNeo,
  saveUser,
  deleteUser,
  updateUser,
  getUserData,
};
