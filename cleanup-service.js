// Ce script nécessite Node.js et les packages axios et node-cron
// Installez-les avec : npm install axios node-cron dotenv

require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');

const COOLIFY_URL = process.env.COOLIFY_URL?.replace(/\/$/, '');
const API_TOKEN = process.env.COOLIFY_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ORG = process.env.GITHUB_ORG || 'usts-ai';
const DAYS_BEFORE_DELETION = process.env.DAYS_BEFORE_DELETION || 14;
const NAME_PATTERN = /^usts-ai\/\d+$/;

// Validation des variables d'environnement
if (!COOLIFY_URL) {
  console.error('❌ COOLIFY_URL manquant dans le .env');
  process.exit(1);
}
if (!API_TOKEN) {
  console.error('❌ COOLIFY_TOKEN manquant dans le .env');
  process.exit(1);
}
if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN manquant dans le .env');
  process.exit(1);
}

console.log(`🔧 Configuration: COOLIFY_URL=${COOLIFY_URL}, GITHUB_ORG=${GITHUB_ORG}`);

async function fetchApplications() {
  try {
    const response = await axios.get(`${COOLIFY_URL}/api/v1/applications`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        Accept: 'application/json',
      },
    });
    
    const apps = Array.isArray(response.data) ? response.data : response.data?.data || [];
    
    if (!Array.isArray(apps)) {
      console.error('❌ Format de réponse inattendu:', typeof apps);
      return [];
    }
    
    return apps
      .map(app => ({
        uuid: app.uuid,
        name: app.name,
        createdAt: app.created_at 
      }))
      .filter(app => {
        const createdAt = new Date(app.createdAt);
        const isValidDate = createdAt instanceof Date && !isNaN(createdAt);
        const diffInDays = isValidDate ? (new Date() - createdAt) / (1000 * 60 * 60 * 24) : 0;
        const isMatch = NAME_PATTERN.test(app.name);
        return isValidDate && diffInDays > DAYS_BEFORE_DELETION && isMatch;
      });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des applications :', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Content-Type:', error.response.headers['content-type']);
    }
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
    console.log(`✅ Application Coolify ${uuid} supprimée.`);
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de l'application ${uuid} :`, error.message);
    throw error;
  }
}

async function deleteGitHubRepo(repoName) {
  try {
    await axios.delete(`https://api.github.com/repos/${GITHUB_ORG}/${repoName}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    console.log(`✅ Repo GitHub ${GITHUB_ORG}/${repoName} supprimé.`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`⚠️ Repo GitHub ${GITHUB_ORG}/${repoName} introuvable (déjà supprimé ?).`);
    } else if (error.response && error.response.status === 403) {
      console.error(`❌ Erreur 403: Permission refusée pour ${repoName}`);
      console.error('   → Vérifiez que votre GITHUB_TOKEN a les scopes: repo + delete_repo');
      console.error('   → Vérifiez que le compte a les droits de suppression sur l\'orga');
    } else {
      console.error(`❌ Erreur lors de la suppression du repo ${repoName} :`, error.message);
    }
  }
}

async function cleanOldApplications() {
  console.log(`🧹 Démarrage du nettoyage des applications...`);
  const apps = await fetchApplications();
  
  console.log(`📊 ${apps.length} application(s) à nettoyer trouvée(s)`);

  for (const app of apps) {
    const createdAt = new Date(app.createdAt);
    console.log(`📅 Application ${app.name} créée le : ${createdAt.toLocaleDateString()}`);
    
    try {
      await deleteApplication(app.uuid);
      
      // Extraire le nom du repo depuis le nom de l'app
      // Format: usts-ai/nom-repo:branch-uuid → nom-repo
      const repoPart = app.name.split('/')[1];
      const repoName = repoPart?.split(':')[0];
      if (repoName) {
        await deleteGitHubRepo(repoName);
      }
    } catch (error) {
      console.error(`❌ Erreur lors du nettoyage de ${app.name}, arrêt du processus pour cette app.`);
    }
  }
}


// Fonction de test pour supprimer un repo spécifique
async function testDeleteRepo(repoName) {
  console.log(`🧪 TEST: Suppression du repo ${repoName}`);
  await deleteGitHubRepo(repoName);
}

// Décommentez pour tester la suppression d'un repo spécifique:
testDeleteRepo('473385');

// Planification du nettoyage 2 fois par jour (à 00h et 12h)
cron.schedule('0 0,12 * * *', cleanOldApplications);

//cron.schedule('* * * * *', cleanOldApplications); // toutes les minutes (pour tests)

// Exécution immédiate au démarrage pour vérifier
console.log('🧹 Test initial...');
cleanOldApplications();

console.log('🚀 Service de nettoyage lancé.');
