# 🧹 Coolify Cleanup Service

Service Node.js qui supprime automatiquement les applications de démonstration obsolètes sur [Coolify](https://coolify.io/).

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

---

## 📋 Description

Ce service surveille et nettoie automatiquement les applications Coolify correspondant au pattern `usts-ai/123456` qui ont été créées il y a plus de **7 jours** (configurable).

**Fonctionnement :**
- 🔍 Scan des applications toutes les 12h (00h00 et 12h00)
- 🎯 Cible uniquement les apps avec le nom `usts-ai/[nombre]`
- 🗑️ Suppression automatique si l'âge dépasse le seuil configuré
- 📊 Logs détaillés des opérations

---

## ⚙️ Configuration

### 1. Variables d'environnement (.env)

Créez un fichier `.env` à la racine du projet :

```bash
# URL de votre instance Coolify (ex: https://coolify.mondomaine.com)
COOLIFY_URL=https://votre-coolify.com

# Token API Coolify (Profile → API Tokens)
COOLIFY_TOKEN=votre_token_api_ici

# Token GitHub Personal Access Token (Settings → Developer settings → Personal access tokens)
GITHUB_TOKEN=votre_github_token_ici

# (Optionnel) Organisation GitHub (défaut: usts-ai)
GITHUB_ORG=usts-ai

# (Optionnel) Nombre de jours avant suppression (défaut: 14)
DAYS_BEFORE_DELETION=7
```

**Comment obtenir votre token Coolify :**
1. Connectez-vous à votre dashboard Coolify
2. Cliquez sur votre **avatar/profil** en haut à droite
3. Allez dans **Profile** → **API Tokens**
4. Créez un nouveau token avec les permissions sur les applications

**Comment obtenir votre token GitHub :**
1. Connectez-vous à GitHub
2. Allez dans **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Générez un nouveau token avec les scopes : `repo` (accès complet aux repos)
4. Copiez le token (il ne s'affiche qu'une fois)

---

## 🚀 Lancement

### Option A : Local (Node.js)

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd cleanup-demo-service-coolify

# 2. Installer les dépendances
npm install

# 3. Configurer le .env
# Créez un fichier .env avec les variables ci-dessus

# 4. Lancer le service
npm start
```

### Option B : Docker Compose

```bash
# 1. Cloner et configurer le .env
git clone <url-du-repo>
cd cleanup-demo-service-coolify
# Créez et éditez le fichier .env

# 2. Lancer avec Docker Compose
docker-compose up -d

# 3. Voir les logs
docker-compose logs -f cleanup
```

### Option C : Docker

```bash
# Build
docker build -t coolify-cleanup .

# Run (avec les variables d'env)
docker run -d \
  --env-file .env \
  --name coolify-cleanup \
  coolify-cleanup
```

---

## 🏗️ Déploiement sur Coolify

Vous pouvez déployer ce service sur votre propre instance Coolify :

1. Créez un nouveau service de type **Docker**
2. Pointez vers ce repository
3. Configurez les variables d'environnement dans l'interface Coolify
4. Déployez !

---

## 📁 Structure du projet

```
.
├── cleanup-service.js      # Script principal
├── package.json           # Dépendances
├── Dockerfile             # Image Docker
├── docker-compose.yml     # Stack Docker Compose
├── .env                   # Variables d'environnement (non commité)
└── README.md              # Ce fichier
```

---

## 🔧 Dépendances

| Package | Version | Usage |
|---------|---------|-------|
| `axios` | ^1.14.0 | Requêtes HTTP API Coolify |
| `node-cron` | ^3.0.0 | Planification des tâches |
| `dotenv` | ^10.0.0 | Gestion des variables d'environnement |

---

## 📝 Logs

Le service affiche les logs suivants :

```
🚀 Service de nettoyage lancé.
🧹 Démarrage du nettoyage des applications...
📅 Application usts-ai/123456 créée le : 15/03/2024
✅ Application abc-123-def supprimée.
```

---

## ⚠️ Sécurité

- Ne jamais commiter le fichier `.env`
- Le fichier `.env` est déjà dans `.gitignore` (à vérifier)
- Utilisez des tokens API avec les permissions minimales nécessaires
- Limitez l'accès à votre instance Coolify par IP si possible

---

## 📄 License

ISC © USTS
