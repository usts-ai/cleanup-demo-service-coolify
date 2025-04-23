// Ce script nécessite Node.js et les packages axios et node-cron
// Installez-les avec : npm install axios node-cron dotenv

require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');

const COOLIFY_URL = process.env.COOLIFY_URL; // ex: 'https://coolify.mondomaine.com'
const API_TOKEN = process.env.COOLIFY_TOKEN;
const DAYS_BEFORE_DELETION = process.env.DAYS_BEFORE_DELETION || 14; // Nombre de jours avant suppression
const NAME_PATTERN = /^usts-ai\/\d+$/; // Regex pour nommer les applications à supprimer

async function fetchApplications() {
  try {
    const response = await axios.get(`${COOLIFY_URL}/api/v1/applications`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });
    // Récupère et filtre directement les apps à supprimer
    return response.data
      .map(app => ({
        uuid: app.uuid,
        name: app.name,
        createdAt: app.created_at // Correction ici
      }))
      .filter(app => {
        const createdAt = new Date(app.createdAt);
        const isValidDate = createdAt instanceof Date && !isNaN(createdAt);
        const diffInDays = isValidDate ? (new Date() - createdAt) / (1000 * 60 * 60 * 24) : 0;
        const isMatch = NAME_PATTERN.test(app.name);
        return isValidDate && diffInDays > DAYS_BEFORE_DELETION && isMatch;
      });
  } catch (error) {
    console.error('Erreur lors de la récupération des applications :', error.message);
    return [];
  }
}

async function deleteApplication(uuid) {
  try {
    await axios.delete(`${COOLIFY_URL}/api/v1/applications/${uuid}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });
    console.log(`✅ Application ${uuid} supprimée.`);
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de l'application ${uuid} :`, error.message);
  }
}

async function cleanOldApplications() {
  console.log(`🧹 Démarrage du nettoyage des applications...`);
  const apps = await fetchApplications();

  for (const app of apps) {
    const createdAt = new Date(app.createdAt);
    console.log(`📅 Application ${app.name} créée le : ${createdAt.toLocaleDateString()}`);
    await deleteApplication(app.uuid);
  }
}


// Planification du nettoyage 2 fois par jour (à 00h et 12h)
// cron.schedule('0 0,12 * * *', cleanOldApplications);

cron.schedule('* * * * *', cleanOldApplications); // toutes les minutes



console.log('🚀 Service de nettoyage lancé.');
