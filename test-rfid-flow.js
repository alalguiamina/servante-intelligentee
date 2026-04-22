/**
 * TEST RFID FLOW
 * 
 * Ce script teste le flux complet d'authentification RFID
 * 
 * Usage:
 *   node test-rfid-flow.js
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

console.log('═'.repeat(60));
console.log('🧪 TEST RFID FLOW — Authentification par badge');
console.log('═'.repeat(60));
console.log(`Backend: ${BACKEND_URL}`);
console.log('═'.repeat(60));

// Test 1: Badge valide
async function testValidBadge() {
    console.log('\n📝 TEST 1: Badge valide');
    console.log('─'.repeat(60));

    try {
        const response = await axios.post(
            `${BACKEND_URL}/hardware/rfid`,
            { uid: '0A1B2C3D' },
            {
                timeout: 5000,
                validateStatus: () => true // Accept any status
            }
        );

        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.success && response.data.authorized) {
            console.log('✅ TEST PASSED: Badge autorisé et JWT généré');
            return true;
        } else {
            console.log('ℹ️  Badge non trouvé dans la base (normal si pas de données de test)');
            return false;
        }
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        return false;
    }
}

// Test 2: Badge invalide
async function testInvalidBadge() {
    console.log('\n📝 TEST 2: Badge invalide');
    console.log('─'.repeat(60));

    try {
        const response = await axios.post(
            `${BACKEND_URL}/hardware/rfid`,
            { uid: 'FFFFFFFF' },
            {
                timeout: 5000,
                validateStatus: () => true
            }
        );

        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (!response.data.success && !response.data.authorized) {
            console.log('✅ TEST PASSED: Badge correctement refusé');
            return true;
        } else {
            console.log('❌ TEST FAILED: Badge invalide devrait être refusé');
            return false;
        }
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        return false;
    }
}

// Test 3: UID manquant
async function testMissingUID() {
    console.log('\n📝 TEST 3: UID manquant');
    console.log('─'.repeat(60));

    try {
        const response = await axios.post(
            `${BACKEND_URL}/hardware/rfid`,
            {},
            {
                timeout: 5000,
                validateStatus: () => true
            }
        );

        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.status === 400) {
            console.log('✅ TEST PASSED: Validation correcte (UID requis)');
            return true;
        } else {
            console.log('❌ TEST FAILED: Devrait retourner 400 Bad Request');
            return false;
        }
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        return false;
    }
}

// Test 4: Anti-bruteforce
async function testAntiBruteforce() {
    console.log('\n📝 TEST 4: Anti-bruteforce (10+ tentatives)');
    console.log('─'.repeat(60));

    try {
        // Envoyer 11 requêtes rapidement
        for (let i = 0; i < 11; i++) {
            await axios.post(
                `${BACKEND_URL}/hardware/rfid`,
                { uid: 'TESTBRUTE' },
                {
                    timeout: 5000,
                    validateStatus: () => true
                }
            );
            console.log(`   Tentative ${i + 1}/11...`);
        }

        // La 11ème devrait être bloquée
        const response = await axios.post(
            `${BACKEND_URL}/hardware/rfid`,
            { uid: 'TESTBRUTE' },
            {
                timeout: 5000,
                validateStatus: () => true
            }
        );

        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.status === 429) {
            console.log('✅ TEST PASSED: Anti-bruteforce fonctionne');
            return true;
        } else {
            console.log('⚠️  Anti-bruteforce pourrait ne pas être actif (ou compteur reset)');
            return false;
        }
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        return false;
    }
}

// Test 5: Vérifier la structure de la réponse
async function testResponseStructure() {
    console.log('\n📝 TEST 5: Structure de la réponse');
    console.log('─'.repeat(60));

    try {
        const response = await axios.post(
            `${BACKEND_URL}/hardware/rfid`,
            { uid: 'STRUCTEST' },
            {
                timeout: 5000,
                validateStatus: () => true
            }
        );

        const data = response.data;

        const hasSuccess = 'success' in data;
        const hasUID = 'uid' in data;
        const hasAuthorized = 'authorized' in data || data.success;
        const hasMessage = 'message' in data;

        console.log('Champs présents:');
        console.log(`  - success: ${hasSuccess ? '✓' : '✗'}`);
        console.log(`  - uid: ${hasUID ? '✓' : '✗'}`);
        console.log(`  - authorized: ${hasAuthorized ? '✓' : '✗'}`);
        console.log(`  - message: ${hasMessage ? '✓' : '✗'}`);

        if (hasSuccess && hasMessage) {
            console.log('✅ TEST PASSED: Structure de réponse valide');
            return true;
        } else {
            console.log('❌ TEST FAILED: Champs manquants dans la réponse');
            return false;
        }
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        return false;
    }
}

// Exécuter tous les tests
async function runAllTests() {
    console.log('\n🚀 Lancement des tests...\n');

    const results = [];

    results.push({ name: 'Badge valide', passed: await testValidBadge() });
    await sleep(500);

    results.push({ name: 'Badge invalide', passed: await testInvalidBadge() });
    await sleep(500);

    results.push({ name: 'UID manquant', passed: await testMissingUID() });
    await sleep(500);

    results.push({ name: 'Structure réponse', passed: await testResponseStructure() });
    await sleep(500);

    // Anti-bruteforce en dernier (crée beaucoup de requêtes)
    results.push({ name: 'Anti-bruteforce', passed: await testAntiBruteforce() });

    // Résumé
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('═'.repeat(60));

    results.forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${result.name}`);
    });

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    console.log('─'.repeat(60));
    console.log(`Total: ${passed}/${total} tests réussis`);
    console.log('═'.repeat(60));

    if (passed === total) {
        console.log('\n🎉 Tous les tests sont passés !');
    } else {
        console.log('\n⚠️  Certains tests ont échoué');
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Vérifier que le backend est accessible
async function checkBackend() {
    try {
        console.log('\n🔍 Vérification de la connexion au backend...');
        await axios.get(`${BACKEND_URL.replace('/api', '')}/`, { timeout: 3000 });
        console.log('✅ Backend accessible\n');
        return true;
    } catch (error) {
        console.error('❌ Backend non accessible');
        console.error(`   Assurez-vous que le backend est lancé sur ${BACKEND_URL}`);
        console.error(`   Commande: cd servante-backend && npm run dev\n`);
        return false;
    }
}

// Point d'entrée
(async () => {
    const backendOk = await checkBackend();

    if (!backendOk) {
        console.log('💡 Lancez d\'abord le backend:');
        console.log('   cd servante-backend');
        console.log('   npm run dev\n');
        process.exit(1);
    }

    await runAllTests();
})();
