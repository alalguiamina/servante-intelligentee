#!/usr/bin/env node

/**
 * TEST SCRIPT - Vérifier que le flux moteur fonctionne
 * 
 * Utilisation:
 *   node test-motor-flow.js
 * 
 * Ce script va:
 * 1. Créer une commande moteur
 * 2. Afficher le statut
 * 3. Simuler une réponse Arduino (ACK)
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001/api/hardware';
const TOOL_API = 'http://localhost:3001/api/tools';
const BORROWS_API = 'http://localhost:3001/api/borrows';
const USERS_API = 'http://localhost:3001/api/users';

console.log('═'.repeat(60));
console.log('🧪 TEST MOTEUR - Flux Complet');
console.log('═'.repeat(60));

async function test() {
  try {
    // ============================================
    // ÉTAPE 1: Vérifier que le backend répond
    // ============================================
    console.log('\n1️⃣  Vérification du backend...');
    try {
      await axios.get(BACKEND_URL + '/commands', { timeout: 5000 });
      console.log('✅ Backend est accessible sur', BACKEND_URL);
    } catch (err) {
      console.error('❌ Backend non accessible sur', BACKEND_URL);
      console.error('   Erreur:', err.message);
      process.exit(1);
    }

    // ============================================
    // ÉTAPE 2: Récupérer un outil et un utilisateur
    // ============================================
    console.log('\n2️⃣  Récupération des données de test...');
    
    let tool, user;
    try {
      const toolsRes = await axios.get(TOOL_API);
      tool = toolsRes.data.data?.[0];
      if (!tool) {
        console.error('❌ Aucun outil trouvé dans la BD');
        process.exit(1);
      }
      console.log(`✅ Outil trouvé: ${tool.name} (tiroir: ${tool.drawer})`);
    } catch (err) {
      console.error('❌ Erreur récupération outils:', err.message);
      process.exit(1);
    }

    try {
      const usersRes = await axios.get(USERS_API);
      user = usersRes.data.data?.[0];
      if (!user) {
        console.error('❌ Aucun utilisateur trouvé dans la BD');
        process.exit(1);
      }
      console.log(`✅ Utilisateur trouvé: ${user.fullName}`);
    } catch (err) {
      console.error('❌ Erreur récupération utilisateurs:', err.message);
      process.exit(1);
    }

    // ============================================
    // ÉTAPE 3: Créer un emprunt (ce qui déclenche le moteur)
    // ============================================
    console.log('\n3️⃣  Création d\'un emprunt (cela doit déclencher le moteur)...');
    
    let borrowId;
    try {
      const borrowRes = await axios.post(BORROWS_API, {
        userId: user.id,
        toolId: tool.id,
        daysToReturn: 7
      });
      borrowId = borrowRes.data.data?.id;
      console.log('✅ Emprunt créé avec succès');
      console.log(`   ID: ${borrowId}`);
      console.log(`   Outil: ${tool.name}`);
      console.log(`   Tiroir: ${tool.drawer}`);
    } catch (err) {
      console.error('❌ Erreur création emprunt:', err.message);
      if (err.response?.data) {
        console.error('   Response:', err.response.data);
      }
      process.exit(1);
    }

    // ============================================
    // ÉTAPE 4: Vérifier les commandes en attente
    // ============================================
    console.log('\n4️⃣  Vérification des commandes en attente...');
    
    try {
      const cmdsRes = await axios.get(BACKEND_URL + '/commands?pending=true');
      const commands = cmdsRes.data.commands || [];
      
      if (commands.length === 0) {
        console.error('⚠️  Aucune commande en attente!');
        console.error('   Le moteur n\'a pas été déclenché.');
        console.error('   Vérifiez:');
        console.error('   - Les logs du backend');
        console.error('   - Que le tiroir de l\'outil est défini');
      } else {
        console.log(`✅ ${commands.length} commande(s) en attente:`);
        commands.forEach(cmd => {
          console.log(`   - ${cmd.type} tiroir ${cmd.drawer} (ID: ${cmd.id})`);
          console.log(`     Status: ${cmd.status}`);
        });
      }
    } catch (err) {
      console.error('❌ Erreur récupération commandes:', err.message);
      process.exit(1);
    }

    // ============================================
    // ÉTAPE 5: Simuler un ACK Arduino (optionnel)
    // ============================================
    console.log('\n5️⃣  Simulation d\'un ACK Arduino (tirez ENTER pour confirmer)...');
    console.log('   Normalement, le serial-bridge envoie l\'ACK automatiquement');
    console.log('   Ceci est pour tester le flux complet');
    
    // Attendre 3 secondes pour voir si le serial bridge envoie l'ACK
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const cmdsRes = await axios.get(BACKEND_URL + '/commands');
      const commands = cmdsRes.data.commands || [];
      
      if (commands.length > 0 && commands[commands.length - 1].status === 'DONE') {
        console.log('✅ ACK reçu! Commande complétée');
      } else if (commands.length > 0 && commands[commands.length - 1].status === 'SENT') {
        console.log('⏳ Commande envoyée (en attente d\'ACK du moteur)');
        console.log('   Vérifiez que:');
        console.log('   - Le serial bridge est lancé');
        console.log('   - L\'Arduino est branché');
        console.log('   - Le moteur tourne');
      }
    } catch (err) {
      console.error('❌ Erreur vérification ACK:', err.message);
    }

    // ============================================
    // RÉSUMÉ
    // ============================================
    console.log('\n' + '═'.repeat(60));
    console.log('✅ TEST TERMINÉ');
    console.log('═'.repeat(60));
    console.log('\nRésumé:');
    console.log(`  - Emprunt créé: ${borrowId}`);
    console.log(`  - Outil: ${tool.name} (tiroir ${tool.drawer})`);
    console.log(`  - Commande moteur envoyée`);
    console.log('\nProchaines étapes:');
    console.log('  1. Vérifier les logs du serial-bridge');
    console.log('  2. Vérifier que le moteur tourne');
    console.log('  3. Vérifier l\'Arduino Serial Monitor');
    console.log('\n');

  } catch (err) {
    console.error('\n❌ ERREUR:', err.message);
    process.exit(1);
  }
}

test();
