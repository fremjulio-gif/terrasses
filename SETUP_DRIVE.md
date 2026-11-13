# ☁️ Guide de Configuration Google Drive pour TERRASSES Audio

Ce guide vous explique pas-à-pas comment connecter votre application web **TERRASSES** à votre compte Google Drive afin d'y héberger automatiquement :
1. Les fichiers audio volumineux (`.wav` et `.mp3`) du compositeur sans limite de taille.
2. La base de données partagée `terrasses-db.json` contenant les repères scéniques, les validations de la metteuse en scène et les commentaires horodatés.

> **Note :** L'application fonctionne immédiatement en mode local (fallback automatique) même sans Google Drive ! Vous pouvez configurer Google Drive dès que vous souhaitez centraliser les fichiers dans le cloud.

---

## Étape 1 : Créer un dossier dédié sur votre Google Drive

1. Rendez-vous sur votre compte [Google Drive](https://drive.google.com).
2. Créez un nouveau dossier, par exemple nommé **`TERRASSES - Audio & Script`**.
3. Ouvrez ce dossier dans votre navigateur.
4. Regardez l'adresse URL dans la barre de votre navigateur :
   ```
   https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0jKLMNOPQRSTUVWXYZ
   ```
5. **Copiez l'identifiant** qui se trouve à la fin de l'URL (la suite de lettres et chiffres après `/folders/`).
6. Collez-le dans votre fichier `.env.local` pour la variable :
   ```env
   GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0jKLMNOPQRSTUVWXYZ
   ```

---

## Étape 2 : Créer un Compte de Service Google Cloud (Gratuit)

Un "Compte de Service" (Service Account) est une identité robot sécurisée qui permet à l'application de lire et d'écrire des fichiers dans votre dossier sans nécessiter d'écran de connexion pour la metteuse en scène.

1. Allez sur la [Console Google Cloud](https://console.cloud.google.com/).
2. Créez un nouveau projet (ex: `terrasses-theatre`) ou sélectionnez un projet existant.
3. Activez l'API Google Drive :
   - Dans la barre de recherche du haut, tapez **"Google Drive API"**.
   - Cliquez dessus puis cliquez sur le bouton bleu **"Activer"** (Enable).
4. Créez le compte de service :
   - Dans le menu de gauche, allez dans **IAM et administration** > **Comptes de service** (Service Accounts).
   - Cliquez sur **"+ Créer un compte de service"**.
   - Nom : `terrasses-drive-bot`.
   - Cliquez sur **Créer et continuer**, puis **OK**.
5. Générez la clé secrète JSON :
   - Cliquez sur l'adresse email du compte de service que vous venez de créer (ex: `terrasses-drive-bot@terrasses-theatre.iam.gserviceaccount.com`).
   - Allez dans l'onglet **"Clés"** (Keys) en haut.
   - Cliquez sur **"Ajouter une clé"** > **"Créer une clé"** > choisissez le format **JSON**.
   - Un fichier `.json` est automatiquement téléchargé sur votre ordinateur.

---

## Étape 3 : Partager le dossier Google Drive avec ce compte

C'est l'étape la plus importante ! Comme pour un collègue de travail :
1. Ouvrez votre dossier Google Drive créé à l'Étape 1.
2. Cliquez sur **Partager** (le bouton avec un bonhomme en haut à droite).
3. Collez l'adresse email de votre compte de service :
   ```
   terrasses-drive-bot@terrasses-theatre.iam.gserviceaccount.com
   ```
4. Donnez-lui le rôle **Éditeur** (Organisateur / Modifications autorisées).
5. Décochez "Envoyer une notification" (puisqu'il s'agit d'un robot) et validez.

---

## Étape 4 : Reporter les clés dans votre fichier `.env.local`

Ouvrez le fichier téléchargé à l'étape 2 avec un éditeur de texte (Bloc-notes, TextEdit ou VS Code). Vous y trouverez :
- `"client_email"`
- `"private_key"`

Reportez-les simplement dans votre fichier `.env.local` à la racine de `Terrasses_AUDIO` :

```env
# ========================================================
# TERRASSES - Configuration Google Drive & Sécurité Admin
# ========================================================

# Code PIN du mode Admin compositeur (Easter Egg : 5 clics sur le logo TERRASSES)
ADMIN_PIN=0000

# Identifiant de votre dossier Google Drive cible
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0jKLMNOPQRSTUVWXYZ

# Email du compte de service Google
GOOGLE_CLIENT_EMAIL=terrasses-drive-bot@terrasses-theatre.iam.gserviceaccount.com

# Clé privée du compte de service (conservez bien les guillemets et les \n)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

---

## 🎯 Fonctionnement de l'application une fois configurée

- **Metteuse en scène** : Accès direct et instantané sans aucune connexion ni compte Google requis. Les pistes audio se chargent en streaming HTTP progressif (support des plages d'octets `206 Partial Content`), avec affichage instantané de la forme d'onde à 10ms grâce aux *peaks* pré-calculés.
- **Compositeur (Mode Admin)** :
  1. Cliquez **5 fois rapidement sur le titre "TERRASSES"** en haut de page (ou appuyez sur `Cmd + Shift + M`).
  2. Entrez votre code PIN (par défaut : `0000`).
  3. Glissez-déposez vos nouveaux fichiers `.wav` ou `.mp3` : ils sont envoyés directement vers Google Drive via l'URL Resumable pour contourner les limites de bande passante, avec calcul immédiat de la forme d'onde côté client.
- **Synchronisation automatique** : Dès qu'une modification ou un commentaire est ajouté, `terrasses-db.json` est mis à jour sur Google Drive et synchronisé en local.
