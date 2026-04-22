/**
 * SCANNER UID - Utilitaire simple pour voir l'UID d'un badge
 * 
 * Ce script affiche l'UID des badges scannés sans les enregistrer.
 * Utile pour noter les UIDs avant de les enregistrer.
 * 
 * Usage:
 *   SERIAL_PORT=COM3 node scan-uid.js
 */

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3';
const BAUD_RATE = 9600;

console.log('═'.repeat(60));
console.log('🔍 SCANNER UID RFID - Mode Lecture Seule');
console.log('═'.repeat(60));
console.log(`Port série: ${SERIAL_PORT}`);
console.log('Baud rate: ' + BAUD_RATE);
console.log('═'.repeat(60));
console.log('\n👉 Approchez un badge du lecteur RFID...\n');
console.log('💡 Astuce: Appuyez sur Ctrl+C pour quitter\n');

let lastUID = null;
const scannedBadges = [];

try {
    const port = new SerialPort(SERIAL_PORT, { baudRate: BAUD_RATE });
    const parser = port.pipe(new Readline({ delimiter: '\n' }));

    port.on('open', () => {
        console.log('✅ Connexion établie avec le lecteur RFID\n');
    });

    port.on('error', (err) => {
        console.error(`❌ Erreur port série: ${err.message}`);
        console.log(`\n💡 Solutions:`);
        console.log(`   1. Vérifiez que l'Arduino est branché`);
        console.log(`   2. Vérifiez le port (Windows: COM3, Linux: /dev/ttyUSB0)`);
        console.log(`   3. Fermez Arduino IDE si ouvert`);
        console.log(`   4. Essayez: SERIAL_PORT=COM4 node scan-uid.js\n`);
        process.exit(1);
    });

    parser.on('data', (line) => {
        line = line.trim();

        if (!line) return;

        // UID détecté
        if (line.startsWith('UID:')) {
            const uid = line.split(':')[1].trim();

            // Éviter les doublons consécutifs
            if (uid === lastUID) return;

            lastUID = uid;
            const timestamp = new Date().toLocaleTimeString('fr-FR');

            console.log('─'.repeat(60));
            console.log(`🏷️  Badge détecté à ${timestamp}`);
            console.log(`    UID: ${uid}`);
            console.log('─'.repeat(60));
            console.log('');

            // Sauvegarder dans l'historique
            scannedBadges.push({ uid, timestamp });

            // Afficher l'historique si > 1
            if (scannedBadges.length > 1) {
                console.log(`📊 Historique de cette session: ${scannedBadges.length} badges scannés\n`);
            }

            setTimeout(() => {
                lastUID = null;
            }, 3000);
        }
        // Messages Arduino
        else if (!line.includes('---') && !line.includes('attente')) {
            console.log(`   [Arduino] ${line}`);
        }
    });

} catch (err) {
    console.error(`❌ Impossible d'ouvrir le port ${SERIAL_PORT}`);
    console.error(`   Erreur: ${err.message}\n`);
    process.exit(1);
}

// Afficher l'historique à la sortie
process.on('SIGINT', () => {
    console.log('\n\n' + '═'.repeat(60));
    console.log('📊 RÉSUMÉ DE LA SESSION');
    console.log('═'.repeat(60));

    if (scannedBadges.length === 0) {
        console.log('Aucun badge scanné');
    } else {
        console.log(`Total: ${scannedBadges.length} badge(s) scanné(s)\n`);

        // Grouper par UID unique
        const uniqueBadges = {};
        scannedBadges.forEach(({ uid, timestamp }) => {
            if (!uniqueBadges[uid]) {
                uniqueBadges[uid] = { uid, count: 0, firstSeen: timestamp, lastSeen: timestamp };
            }
            uniqueBadges[uid].count++;
            uniqueBadges[uid].lastSeen = timestamp;
        });

        console.log('Badges uniques:');
        Object.values(uniqueBadges).forEach(({ uid, count, firstSeen, lastSeen }) => {
            console.log(`  • ${uid}`);
            console.log(`    Scanné ${count} fois`);
            console.log(`    Premier scan: ${firstSeen}`);
            if (count > 1) {
                console.log(`    Dernier scan: ${lastSeen}`);
            }
            console.log('');
        });
    }

    console.log('═'.repeat(60));
    console.log('👋 Au revoir!\n');
    process.exit(0);
});
