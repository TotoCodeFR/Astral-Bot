import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';
import https from 'https';

const FONT_NAME = 'Poppins';
const HOME_DIR = os.homedir();
const FONT_DIR = path.join(HOME_DIR, '.fonts', 'poppins'); // dossier utilisateur
const FILES = [
  'Poppins-Regular.ttf',
  'Poppins-Bold.ttf',
  'Poppins-Italic.ttf',
  'Poppins-BoldItalic.ttf',
];
const BASE_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/';

// Fonction pour vérifier si la police est déjà installée
function isFontInstalled() {
  try {
    const result = execSync(`fc-list | grep -i ${FONT_NAME}`, { encoding: 'utf-8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

// Fonction pour télécharger un fichier
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function installFonts() {
  if (isFontInstalled()) {
    console.log(`${FONT_NAME} est déjà installé.`);
    return;
  }

  console.log(`${FONT_NAME} non trouvé, installation...`);

  // Crée le dossier si nécessaire
  fs.mkdirSync(FONT_DIR, { recursive: true });

  // Téléchargement des fichiers
  for (const file of FILES) {
    const url = BASE_URL + file;
    const dest = path.join(FONT_DIR, file);
    console.log(`Téléchargement de ${file}...`);
    try {
      await downloadFile(url, dest);
      console.log(`${file} téléchargé.`);
    } catch (err) {
      console.error(`Erreur téléchargement ${file} :`, err.message);
      return;
    }
  }

  // Rafraîchir la cache des polices
  console.log('Rafraîchissement du cache fontconfig...');
  try {
    execSync('fc-cache -fv', { stdio: 'inherit' });
  } catch (err) {
    console.error('Erreur lors du rafraîchissement de la cache:', err.message);
    return;
  }

  if (isFontInstalled()) {
    console.log(`${FONT_NAME} a été installé avec succès !`);
  } else {
    console.error(`${FONT_NAME} n'a pas été détecté après installation.`);
  }
}

installFonts();
