/**
 * ENREGISTREMENT DE BADGES RFID
 * 
 * Ce script permet d'enregistrer un badge RFID pour un nouvel utilisateur
 * 
 * Workflow:
 * 1. Scanner le badge avec l'Arduino
 * 2. Le script récupère l'UID depuis le port série
 * 3. Demande les informations de l'utilisateur (nom, email, etc.)
 * 4. Crée l'utilisateur dans la base de données avec le badgeId
 * 
 * Usage:
 *   SERIAL_PORT=COM3 node register-badge.js
 */

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const readline = require('readline');
const axios = require('axios');

// ============================================
// CONFIGURATION
// ============================================

const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';
const BAUD_RATE = 9600;

console.log('═'.repeat(60));
console.log('🏷️  ENREGISTREMENT DE BADGE RFID');
console.log('═'.repeat(60));
console.log(`Port série: ${SERIAL_PORT}`);
console.log(`Backend: ${BACKEND_URL}`);
console.log('═'.repeat(60));
console.log('');

// ============================================
// INTERFACE UTILISATEUR
// ============================================

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// ============================================
// CONNEXION SÉRIE
// ============================================

let detectedUID = null;
let waitingForBadge = false;

let port;
let parser;

try {
    port = new SerialPort(SERIAL_PORT, { baudRate: BAUD_RATE });
    parser = port.pipe(new Readline({ delimiter: '\n' }));

    port.on('open', () => {
        console.log('✅ Port série ouvert\n');
        startRegistration();
    });

    port.on('error', (err) => {
        console.error(`❌ Erreur port série: ${err.message}`);
        console.log(`   Vérifiez que le port ${SERIAL_PORT} est correct`);
        process.exit(1);
    });

    // Écouter les messages du port série
    parser.on('data', (line) => {
        line = line.trim();

        if (waitingForBadge && line.startsWith('UID:')) {
            const uid = line.split(':')[1].trim();
            detectedUID = uid;
            console.log(`\n🎯 Badge détecté: ${uid}\n`);
            waitingForBadge = false;
        }
    });

} catch (err) {
    console.error(`❌ Impossible d'ouvrir le port ${SERIAL_PORT}`);
    console.error(`   Erreur: ${err.message}`);
    process.exit(1);
}

// ============================================
// LOGIQUE D'ENREGISTREMENT
// ============================================

async function startRegistration() {
    try {
        console.log('📝 Processus d\'enregistrement d\'un nouveau badge\n');
        console.log('Veuillez scanner le badge RFID maintenant...\n');

        // Attendre la détection du badge
        waitingForBadge = true;
        detectedUID = null;

        await waitForBadge();

        console.log('📋 Informations de l\'utilisateur:\n');

        const fullName = await question('Nom complet: ');
        const email = await question('Email: ');

        console.log('\nRôle:');
        console.log('  1. STUDENT (Étudiant)');
        console.log('  2. PROFESSOR (Professeur)');
        console.log('  3. TECHNICIAN (Technicien)');
        console.log('  4. ADMIN (Administrateur)');
        const roleChoice = await question('Choisir (1-4): ');

        const roles = { '1': 'STUDENT', '2': 'PROFESSOR', '3': 'TECHNICIAN', '4': 'ADMIN' };
        const role = roles[roleChoice] || 'STUDENT';

        console.log('\n─'.repeat(60));
        console.log('📋 RÉCAPITULATIF:');
        console.log('─'.repeat(60));
        console.log(`Badge ID: ${detectedUID}`);
        console.log(`Nom: ${fullName}`);
        console.log(`Email: ${email}`);
        console.log(`Rôle: ${role}`);
        console.log('─'.repeat(60));
        console.log('');

        const confirm = await question('Confirmer l\'enregistrement? (o/n): ');

        if (confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'oui') {
            console.log('\n❌ Enregistrement annulé\n');
            await askForAnother();
            return;
        }

        // Enregistrer dans la base de données
        console.log('\n⏳ Enregistrement en cours...');

        try {
            const response = await axios.post(
                `${BACKEND_URL}/users`,
                {
                    fullName,
                    email,
                    badgeId: detectedUID,
                    role
                },
                { timeout: 5000 }
            );

            console.log('\n✅ Badge enregistré avec succès !');
            console.log(`   ID utilisateur: ${response.data.data.id}\n`);

            // Tester l'authentification
            console.log('🧪 Test d\'authentification...');

            const authResponse = await axios.post(
                `${BACKEND_URL}/auth/badge-scan`,
                { badgeId: detectedUID },
                { timeout: 5000 }
            );

            if (authResponse.data.success) {
                console.log('✅ Authentification réussie !');
                console.log(`   Bienvenue ${authResponse.data.data.user.fullName}\n`);
            }

        } catch (error) {
            console.error('\n❌ Erreur lors de l\'enregistrement:');
            if (error.response) {
                console.error(`   ${error.response.data.message || error.response.statusText}`);
                if (error.response.data.errors) {
                    error.response.data.errors.forEach(err => {
                        console.error(`   - ${err}`);
                    });
                }
            } else {
                console.error(`   ${error.message}`);
            }
            console.log('\n💡 Vérifiez que le backend est lancé et accessible\n');
        }

        await askForAnother();

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        process.exit(1);
    }
}

async function waitForBadge() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (detectedUID !== null) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
    });
}

async function askForAnother() {
    const another = await question('\nEnregistrer un autre badge? (o/n): ');

    if (another.toLowerCase() === 'o' || another.toLowerCase() === 'oui') {
        console.log('\n' + '═'.repeat(60) + '\n');
        startRegistration();
    } else {
        console.log('\n👋 Au revoir!\n');
        rl.close();
        port.close();
        process.exit(0);
    }
}

// ============================================
// GESTION DE L'ARRÊT
// ============================================

process.on('SIGINT', () => {
    console.log('\n\n⏸  Arrêt...');
    rl.close();
    if (port && port.isOpen) {
        port.close();
    }
    process.exit(0);
});
