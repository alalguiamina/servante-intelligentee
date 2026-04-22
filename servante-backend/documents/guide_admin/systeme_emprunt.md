# Système d'Emprunt - Règles et Gestion

## ⏱️ Durées d'Emprunt

### Durées Standards par Catégorie

#### Outils de Mesure Électrique
**Durée : 7 jours**
- Pince ampèremétrique
- Multimètre

**Justification :**
- Utilisation généralement pour des projets courts
- Forte demande
- Nécessite rotation rapide

#### Outils de Mesure Mécanique - Standard
**Durée : 7 jours**
- Rapporteur d'angle
- Jauge d'épaisseur
- Jauge de profondeur

**Justification :**
- Outils de mesure nécessaires pour des phases spécifiques de projet
- Équilibre entre besoin utilisateur et disponibilité

#### Outils de Mesure Mécanique - Précision
**Durée : 5 jours**
- Rapporteur d'angle numérique
- Inclinomètre numérique

**Justification :**
- Outils de haute précision
- Valeur élevée
- Demande importante
- Nécessite étalonnage régulier

#### Outils de Mesure Générale
**Durée : 14 jours**
- Compas
- Équerre
- Mètre ruban

**Justification :**
- Utilisation fréquente sur toute la durée d'un projet
- Disponibilité en quantité suffisante
- Faible risque de dégradation

#### Outils d'Électronique
**Durée : 14 jours**
- Jeu de tournevis d'électronique
- Pince à dénuder et à sertir automatique

**Justification :**
- Nécessaire pour des projets complets
- Utilisation régulière pendant la durée du projet
- Bonne rotation malgré durée longue

#### Outils Généraux
**Durée : 14 jours**
- Ciseaux blancs
- Mini brosse

**Justification :**
- Usage courant
- Faible valeur
- Grande disponibilité

---

## 📅 Système de Prolongation

### Règles Générales

**Conditions d'éligibilité :**
- ✅ Aucune réservation en attente sur l'outil
- ✅ Pas de retard en cours sur d'autres outils
- ✅ Maximum 2 prolongations par emprunt
- ✅ La demande doit être faite AVANT la date de retour
- ✅ L'utilisateur ne doit pas avoir d'avertissements actifs

**Durée de prolongation :**
- **Outils standard (7-14 jours)** : +3 jours par prolongation
- **Outils de précision (5 jours)** : +2 jours par prolongation
- **Durée maximale totale** : 21 jours (emprunt initial + prolongations)

### Procédure de Prolongation

#### Pour l'Utilisateur
1. Se connecter au site web
2. Aller dans "Mes emprunts en cours"
3. Cliquer sur "Prolonger" à côté de l'outil concerné
4. Le système vérifie automatiquement l'éligibilité
5. Confirmation immédiate ou refus avec raison

#### Pour l'Administrateur (prolongation manuelle)
1. Accéder à "Gestion des emprunts" → "Emprunts en cours"
2. Rechercher l'emprunt concerné
3. Cliquer sur "Actions" → "Prolonger manuellement"
4. Sélectionner la nouvelle date de retour
5. Ajouter une note justificative (obligatoire)
6. Valider

**Cas nécessitant une prolongation manuelle :**
- Dépassement du nombre maximum de prolongations
- Prolongation au-delà de 21 jours
- Prolongation malgré une réservation (annulation de réservation)
- Cas exceptionnels validés par un superviseur

### Gestion des Refus de Prolongation

**Raisons de refus automatique :**
1. **Réservation en attente**
   - Message : "Cet outil est réservé par un autre utilisateur à partir du [date]"
   - Action suggérée : Retourner l'outil à temps ou contacter l'administrateur

2. **Retard en cours**
   - Message : "Vous avez un ou plusieurs outils en retard. Veuillez les retourner avant de prolonger."
   - Action : Retourner les outils en retard

3. **Limite de prolongations atteinte**
   - Message : "Vous avez atteint le nombre maximum de prolongations (2) pour cet outil."
   - Action : Retourner l'outil et le réemprunter si disponible

4. **Durée maximale dépassée**
   - Message : "La durée totale d'emprunt ne peut excéder 21 jours."
   - Action : Retourner l'outil

5. **Demande tardive**
   - Message : "La date de retour est dépassée. Veuillez retourner l'outil dès que possible."
   - Action : Retourner immédiatement

**Notification des utilisateurs :**
- Email automatique en cas de refus
- Explication claire de la raison
- Alternatives proposées (autres outils similaires disponibles)

---

## ⚠️ Système de Pénalités pour Retard

### Niveaux de Pénalité

#### Niveau 1 : Avertissement (1-2 jours de retard)
**Actions automatiques :**
- Email d'avertissement envoyé quotidiennement
- SMS envoyé après 2 jours (si numéro renseigné)
- Rappel affiché sur le compte utilisateur

**Conséquences :**
- Aucune restriction d'accès
- Enregistrement dans l'historique
- Premier avertissement formel

**Résolution :**
- Retourner l'outil dès que possible
- Aucune pénalité supplémentaire si retour sous 2 jours

---

#### Niveau 2 : Suspension Temporaire (3-7 jours de retard)
**Actions automatiques :**
- Blocage des nouveaux emprunts
- Email et SMS quotidiens
- Notification à l'administrateur

**Conséquences :**
- **Suspension de 3 jours** après le retour de l'outil
- Impossibilité d'emprunter pendant la suspension
- Les réservations futures sont annulées
- Comptabilisation dans le dossier utilisateur

**Calcul de la suspension :**
- Débute le jour du retour effectif de l'outil
- 72 heures pleines
- Pas de réduction possible (sauf cas exceptionnel validé par admin)

**Communication :**
- Email de suspension avec date de fin
- Rappel 24h avant la fin de suspension
- Email de réactivation automatique

**Résolution :**
- Retourner l'outil en retard
- Attendre la fin de la période de suspension
- Compte automatiquement réactivé

---

#### Niveau 3 : Suspension Longue (8-14 jours de retard)
**Actions automatiques :**
- Blocage total du compte
- Notification à l'administrateur et au superviseur
- Alerte de sécurité (outil potentiellement perdu)
- Convocation automatique générée

**Conséquences :**
- **Suspension de 7 jours** après le retour
- **Rendez-vous obligatoire** avec l'administrateur
- Vérification de l'état de l'outil
- Évaluation des dommages éventuels
- Peut entraîner des frais de réparation

**Procédure de rendez-vous :**
1. L'utilisateur reçoit une convocation par email
2. Rendez-vous à fixer dans les 5 jours ouvrés
3. Discussion sur les circonstances du retard
4. Vérification de l'outil avec l'utilisateur présent
5. Compte-rendu écrit et signé par les deux parties
6. Décision sur les suites à donner

**Réactivation du compte :**
- Nécessite validation manuelle par l'administrateur
- Possible seulement après le rendez-vous
- Peut inclure des conditions (ex: limitation temporaire du nombre d'emprunts)

---

#### Niveau 4 : Blocage Complet (Plus de 14 jours de retard)
**Actions automatiques :**
- **Blocage définitif** du compte jusqu'à régularisation
- Notification au service de sécurité du laboratoire
- Procédure de perte/vol déclenchée
- Facturation de l'outil si non retourné sous 30 jours

**Conséquences immédiates :**
- Accès révoqué à tous les services du laboratoire
- Impossibilité d'emprunter tout équipement
- Badge désactivé pour la servante
- Signalement à la direction

**Procédure de régularisation :**
1. **Si l'outil est retourné :**
   - Inspection complète de l'état
   - Évaluation des dommages
   - Facturation si réparations nécessaires
   - Rendez-vous obligatoire avec le responsable du laboratoire
   - Décision sur la réactivation du compte (peut être refusée)

2. **Si l'outil n'est pas retourné :**
   - Déclaration de perte/vol
   - Facturation du prix de remplacement
   - Procédure disciplinaire
   - Interdiction permanente possible

**Coûts facturés :**
- Prix de remplacement de l'outil
- Frais administratifs (50€)
- Frais de traitement du dossier (30€)
- Total débité du compte de l'utilisateur ou de son département

**Réactivation éventuelle :**
- Nécessite autorisation du responsable du laboratoire
- Période probatoire de 6 mois
- Limitation stricte (1 outil à la fois, durée réduite)
- Révision après 6 mois de comportement exemplaire

---

### Circonstances Atténuantes

**Retards justifiés acceptables :**
Les pénalités peuvent être annulées ou réduites dans les cas suivants :

1. **Urgence médicale**
   - Justificatif médical obligatoire
   - Hospitalisation
   - Maladie grave

2. **Cas de force majeure**
   - Catastrophe naturelle
   - Grève des transports prolongée
   - Fermeture inattendue du laboratoire

3. **Problèmes techniques du système**
   - Panne de la servante empêchant le retour
   - Bug du système de retour
   - Dysfonctionnement technique avéré

**Procédure de contestation :**
1. Contacter l'administrateur sous 48h après réception de la pénalité
2. Fournir les justificatifs nécessaires
3. L'administrateur examine le dossier sous 5 jours ouvrés
4. Décision communiquée par email
5. Si acceptée : annulation des pénalités
6. Si refusée : possibilité d'appel auprès du responsable du laboratoire

---

## 📧 Système de Notifications

### Notifications Automatiques pour les Emprunts

#### Avant l'Emprunt
**Réservation confirmée**
- Envoyé immédiatement après la réservation
- Contenu : date/heure de retrait, nom de l'outil, instructions

**Rappel de réservation (J-1)**
- Envoyé 24h avant l'heure de retrait prévue
- Contenu : rappel de la réservation, localisation de la servante

**Annulation de réservation**
- Envoyé si réservation annulée (par l'utilisateur ou automatiquement)
- Contenu : raison de l'annulation, alternatives possibles

#### Pendant l'Emprunt
**Confirmation d'emprunt**
- Envoyé immédiatement après le retrait de l'outil
- Contenu : nom de l'outil, date de retour prévue, durée, conditions

**Rappel de retour (J-2)**
- Envoyé 2 jours avant la date de retour
- Contenu : date de retour, procédure de retour, option de prolongation

**Rappel de retour (J-1)**
- Envoyé 24h avant la date de retour
- Contenu : dernier rappel, horaires d'ouverture, pénalités en cas de retard

**Rappel de retour (Jour J)**
- Envoyé le matin du jour de retour
- Contenu : date limite ce jour, urgence du retour

**Prolongation acceptée**
- Envoyé immédiatement après l'acceptation de la prolongation
- Contenu : nouvelle date de retour, nombre de prolongations restantes

**Prolongation refusée**
- Envoyé immédiatement après le refus
- Contenu : raison du refus, alternatives

#### Après l'Emprunt
**Confirmation de retour**
- Envoyé immédiatement après le dépôt de l'outil
- Contenu : remerciement, durée totale d'emprunt, invitation à noter l'expérience

**Demande de signalement de problème**
- Envoyé 1h après le retour
- Contenu : invitation à signaler tout problème constaté sur l'outil

#### Notifications de Retard
**Premier retard (Jour J+1)**
- Envoyé à 9h00
- Contenu : rappel urgent, conséquences du retard, contact administrateur

**Retard 2-3 jours (Quotidien)**
- Envoyé à 9h00 chaque jour
- Contenu : nombre de jours de retard, pénalités encourues, urgence

**Retard 3-7 jours (Quotidien + SMS)**
- Envoyé à 9h00 (email) et 10h00 (SMS)
- Contenu : suspension imminente, dernière chance avant blocage

**Retard 8+ jours (Escalade)**
- Email + SMS quotidien
- Contenu : convocation, procédure en cours, conséquences graves

---

### Notifications pour les Administrateurs

#### Alertes Système
**Outil non retourné (J+1)**
- Envoyé à 10h00
- Liste des outils en retard et des emprunteurs
- Actions suggérées

**Outil en retard critique (J+7)**
- Envoyé immédiatement
- Détails de l'emprunt, historique de l'utilisateur
- Nécessite intervention

**Outil potentiellement perdu (J+14)**
- Alerte prioritaire
- Déclenchement de la procédure de perte
- Actions urgentes requises

#### Alertes Maintenance
**Outil signalé défectueux**
- Envoyé immédiatement après signalement
- Détails du problème, photos éventuelles
- Outil automatiquement en maintenance

**Maintenance planifiée à effectuer**
- Envoyé 7 jours avant la date prévue
- Liste des outils concernés
- Préparation nécessaire

**Étalonnage à prévoir**
- Envoyé 30 jours avant expiration du certificat
- Outils de mesure concernés
- Planification nécessaire

#### Alertes Utilisateurs
**Utilisateur avec retards fréquents**
- Envoyé mensuellement
- Liste des utilisateurs à surveiller
- Historique des retards

**Demande de prolongation exceptionnelle**
- Envoyé immédiatement
- Détails de la demande
- Validation manuelle requise

---

### Personnalisation des Notifications

#### Pour les Utilisateurs
**Paramètres disponibles :**
- Activer/désactiver les notifications email
- Activer/désactiver les notifications SMS
- Choisir le délai des rappels (1, 2 ou 3 jours avant)
- Recevoir un résumé hebdomadaire des emprunts

**Accès aux paramètres :**
1. Se connecter au site web
2. Aller dans "Mon compte" → "Préférences de notification"
3. Modifier les paramètres
4. Sauvegarder

**Note :** Les notifications critiques (retard, blocage) ne peuvent pas être désactivées.

#### Pour les Administrateurs
**Paramètres disponibles :**
- Choisir les types d'alertes à recevoir
- Définir des seuils d'alerte personnalisés
- Programmer des rapports automatiques
- Déléguer certaines notifications à d'autres admins

---

## 📊 Statistiques et Rapports d'Emprunt

### Tableaux de Bord Disponibles

#### Pour les Administrateurs
**Vue d'ensemble :**
- Nombre total d'emprunts actifs
- Nombre d'outils en retard
- Taux d'utilisation global
- Alertes en attente

**Rapports mensuels :**
- Nombre d'emprunts par outil
- Durée moyenne d'emprunt
- Taux de retard par utilisateur
- Outils les plus demandés

**Rapports annuels :**
- Évolution de l'utilisation
- Analyse des coûts (maintenance, pertes)
- Performance du système
- Recommandations d'achat

#### Pour les Utilisateurs
**Mon activité :**
- Emprunts en cours
- Historique des emprunts
- Outils favoris
- Statistiques personnelles

---

## 🔄 Workflow Complet d'un Emprunt

### Diagramme du Processus

```
[Utilisateur] → [Connexion] → [Sélection outil]
                                    ↓
                     [Outil disponible ?] → Non → [Réservation possible ?]
                                    ↓ Oui                    ↓
                         [Scan badge] ← ←  ← ← ← ← ← ← ← ← ← Oui
                                    ↓
                      [Ouverture compartiment]
                                    ↓
                         [Retrait outil]
                                    ↓
                     [Confirmation emprunt]
                                    ↓
                    [Utilisation (max 21 jours)]
                                    ↓
             [Prolongation ?] → Oui → [Vérification conditions]
                    ↓ Non                         ↓
              [Retour outil]  ← ← ← ← ← ← ← ← ← ← 
                    ↓
          [Scan badge + Dépôt]
                    ↓
         [Vérification état outil]
                    ↓
      [Confirmation retour] → [Fin]
```

### Étapes Détaillées

**1. Réservation/Emprunt Direct**
- Durée : 2-5 minutes
- Acteurs : Utilisateur, Système
- Validation automatique

**2. Période d'Emprunt**
- Durée : 5-21 jours selon outil
- Rappels automatiques
- Option de prolongation

**3. Retour**
- Durée : 1-3 minutes
- Vérification automatique
- Confirmation immédiate

**4. Traitement Post-Retour**
- Vérification de l'état (admin si signalement)
- Nettoyage si nécessaire
- Remise en service ou maintenance

---

## 🆘 Gestion des Cas Exceptionnels

### Perte ou Vol d'un Outil

**Procédure pour l'utilisateur :**
1. Signaler immédiatement (max 24h)
2. Remplir le formulaire de déclaration
3. Fournir les circonstances détaillées
4. Déposer une main courante si vol

**Procédure administrative :**
1. Investigation sur les circonstances
2. Évaluation de la responsabilité
3. Décision sur la facturation
4. Commande de remplacement

**Facturation :**
- Prix d'achat + frais administratifs
- Possibilité de prise en charge par l'assurance selon les cas
- Échelonnement de paiement possible

### Outil Endommagé

**Dommages mineurs (usure normale) :**
- Aucun frais
- Outil mis en maintenance
- Utilisateur non pénalisé

**Dommages importants (négligence) :**
- Évaluation du coût de réparation
- Facturation partielle ou totale
- Avertissement enregistré

**Dommages graves (mauvais usage volontaire) :**
- Facturation complète
- Suspension du compte
- Possibilité de sanctions disciplinaires

### Extension d'Urgence de Durée d'Emprunt

**Cas acceptables :**
- Problème technique imprévu sur le projet
- Urgence académique (présentation, examen)
- Indisponibilité forcée (maladie courte)

**Procédure :**
1. Contacter l'administrateur AVANT la date de retour
2. Expliquer la situation
3. Fournir des justificatifs si possible
4. Attendre la validation

**Décision de l'administrateur :**
- Analyse de l'historique de l'utilisateur
- Vérification des réservations en attente
- Accord ou refus motivé
- Prolongation exceptionnelle possible jusqu'à 7 jours supplémentaires

---

## 📱 Intégration Mobile et API

### Application Mobile (en développement)
- Consultation en temps réel des disponibilités
- Réservation depuis le smartphone
- Notifications push
- Scan de QR code pour emprunt

### API pour Intégrations
- API REST disponible pour les développeurs
- Documentation complète sur demande
- Webhooks pour événements (emprunt, retour, retard)
- Intégration avec systèmes tiers (LDAP, SSO)
