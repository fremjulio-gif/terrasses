# 🎭 TERRASSES — Application Web Audio & Dramaturgie

Application web sur-mesure dédiée à la création théâtrale de **"TERRASSES"** de **Laurent Gaudé**, permettant au compositeur d'héberger, d'organiser et de faire écouter ses compositions musicales (`.wav` et `.mp3`) à la metteuse en scène, synchronisées avec le texte du script et les intentions dramaturgiques.

---

## ✨ Points Forts & Direction Artistique

- **Design System Apple VisionOS / iOS 18 "Liquid Glass" Adaptatif** :
  - Matériaux en verre dépoli ultra-translucides (`backdrop-blur-2xl backdrop-saturate-180`).
  - Lignes spéculaires et ombres douces.
  - Thème clair (ambiance répétition studio) et sombre (ambiance régie plateau) avec détection automatique de l'OS.
  - Dégradés organiques vivants (mesh gradients) qui respirent au rythme de la lecture sonore.
- **WaveSurfer.js type SoundCloud / Apple** :
  - Forme d'onde en barres arrondies avec dégradé fluide.
  - **Optimisation 10 millisecondes** : Pré-calcul des *peaks* audio côté client avec `OfflineAudioContext`, permettant d'afficher l'onde immédiatement sans avoir à télécharger 80 Mo de fichier `.wav`.
  - Mise en boucle globale de la piste (Loop) et boucles d'ajustement A-B pour le calage en répétition.
  - Dock flottant persistant en bas d'écran (*Bottom Floating Dock*).
- **Organisation Dramaturgique (Script V3 terrasses.pdf)** :
  - Découpage complet en 4 Actes et 15 Scènes avec repères scéniques (Cues), pages du PDF et citations exactes.
  - Intégration des 4 axes musicaux du document de direction théâtrale `DT.rtf` :
    - **Acte I : L'Insouciance Fragile** — Fa Lydien / Do majeur, 72 BPM, Piano feutré.
    - **Acte II : Le Hasard & La Sidération** — Si Locrien, Rubato, Drone Buchla, acouphène 8 kHz.
    - **Acte III : La Fosse & Bataclan** — Sol Phrygien / Ré# mineur, 124 BPM, Techno industrielle.
    - **Acte IV : L'Oratorio de la Fraternité** — La Dorien / Do mineur, 60 BPM, Chœurs sans paroles.
- **Espace Metteuse en Scène (Accès Libre)** :
  - Zéro connexion : ouverture directe du catalogue.
  - Validation rapide en 1 clic : `Validé`, `À ajuster`, `En réflexion`.
  - Commentaires horodatés avec case automatique *"Lier au timecode [MM:SS]"* et marqueurs cliquables interactifs sur la waveform.
  - Téléchargement direct des fichiers originaux pour la régie son.
- **Espace Compositeur (Mode Admin Easter Egg)** :
  - Déclenchement secret : **5 clics rapides sur le logo TERRASSES** ou raccourci clavier `Cmd + Shift + M`.
  - Authentification par code PIN secret (défini dans `.env.local`).
  - Zone de Drag & Drop pour ajouter de nouveaux fichiers audio.
  - Édition des repères scéniques, tonalités, BPM, notes d'intention, remplacement de versions (V1 -> V2) et suppression.
- **Stockage Centralisé Google Drive API v3 & Fallback Local** :
  - Support de **Google Drive Resumable Upload URL** pour contourner la limite de 4.5 Mo serverless.
  - Streaming audio progressif avec support HTTP Range `206 Partial Content`.
  - Base de données `terrasses-db.json` sur Google Drive avec synchronisation miroir locale `src/data/local-db.json`.

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement en développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 3. Extraire une nouvelle version du script PDF
Si une nouvelle version du texte est livrée (ex: `V4 terrasses.pdf`) :
```bash
python3 scripts/extract-script.py "/chemin/vers/votre_nouveau_script.pdf"
```

### 4. Configuration Google Drive
Consultez le guide dédié [SETUP_DRIVE.md](file:///Users/fffamily/Documents/TERRASSES/Terrasses_AUDIO/SETUP_DRIVE.md) pour connecter votre dossier Drive et votre compte de service en 4 étapes simples.

---

## 🛠️ Stack Technique

- **Framework** : Next.js 14 (App Router, TypeScript)
- **Styles & UI** : Tailwind CSS, Framer Motion, Lucide React
- **Moteur Audio** : WaveSurfer.js v7, Web Audio API (`OfflineAudioContext`)
- **Stockage & Cloud** : Google Drive API v3 (`googleapis`), Node.js Streams HTTP Range 206
- **Extraction PDF** : Python 3, `pypdf`
