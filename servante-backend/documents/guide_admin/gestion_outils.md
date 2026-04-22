# Gestion des Outils - Documentation Administrateur

## 📦 Catalogue des Outils du Laboratoire

### Liste complète des outils disponibles

#### Outils de Mesure Électrique
1. **Pince ampèremétrique**
   - Catégorie : Mesure électrique
   - Référence : ELEC-001
   - Durée d'emprunt standard : 7 jours
   - Compartiment servante : A1-A3

2. **Multimètre**
   - Catégorie : Mesure électrique
   - Référence : ELEC-002
   - Durée d'emprunt standard : 7 jours
   - Compartiment servante : A4-A6

#### Outils de Mesure Mécanique
3. **Compas**
   - Catégorie : Mesure mécanique
   - Référence : MEC-001
   - Durée d'emprunt standard : 14 jours
   - Compartiment servante : B1-B2

4. **Rapporteur d'angle**
   - Catégorie : Mesure mécanique
   - Référence : MEC-002
   - Durée d'emprunt standard : 7 jours
   - Compartiment servante : B3-B4

5. **Rapporteur d'angle numérique**
   - Catégorie : Mesure mécanique - Précision
   - Référence : MEC-003
   - Durée d'emprunt standard : 5 jours
   - Compartiment servante : B5

6. **Inclinomètre numérique**
   - Catégorie : Mesure mécanique - Précision
   - Référence : MEC-004
   - Durée d'emprunt standard : 5 jours
   - Compartiment servante : B6

7. **Jauge d'épaisseur**
   - Catégorie : Mesure mécanique
   - Référence : MEC-005
   - Durée d'emprunt standard : 7 jours
   - Compartiment servante : C1-C2

8. **Jauge de profondeur**
   - Catégorie : Mesure mécanique
   - Référence : MEC-006
   - Durée d'emprunt standard : 7 jours
   - Compartiment servante : C3-C4

9. **Équerre**
   - Catégorie : Mesure mécanique
   - Référence : MEC-007
   - Durée d'emprunt standard : 14 jours
   - Compartiment servante : C5-C6

#### Outils d'Électronique
10. **Jeu de tournevis d'électronique**
    - Catégorie : Électronique
    - Référence : ELEC-003
    - Durée d'emprunt standard : 14 jours
    - Compartiment servante : D1-D3

11. **Pince à dénuder et à sertir automatique**
    - Catégorie : Électronique
    - Référence : ELEC-004
    - Durée d'emprunt standard : 7 jours
    - Compartiment servante : D4-D5

#### Outils Généraux
12. **Mètre ruban**
    - Catégorie : Mesure générale
    - Référence : GEN-001
    - Durée d'emprunt standard : 14 jours
    - Compartiment servante : E1-E4

13. **Ciseaux blancs**
    - Catégorie : Outillage général
    - Référence : GEN-002
    - Durée d'emprunt standard : 14 jours
    - Compartiment servante : E5-E6

14. **Mini brosse**
    - Catégorie : Nettoyage
    - Référence : GEN-003
    - Durée d'emprunt standard : 14 jours
    - Compartiment servante : F1-F2

---

## ➕ Ajouter un Nouvel Outil

### Procédure complète

#### 1. Préparation de l'outil
- Vérifiez l'état de l'outil (fonctionnel, complet)
- Nettoyez l'outil
- Préparez les accessoires éventuels
- Prenez une photo de qualité de l'outil
- Attribuez un numéro de série ou code-barres

#### 2. Enregistrement dans le système

**Via l'interface web administrateur :**
1. Connectez-vous avec un compte administrateur
2. Accédez à "Gestion des outils" → "Ajouter un outil"
3. Remplissez le formulaire :

**Informations obligatoires :**
- **Nom de l'outil** : Nom complet et descriptif
- **Référence** : Code unique (ex: ELEC-005)
- **Catégorie** : Sélectionnez dans la liste
  - Mesure électrique
  - Mesure mécanique
  - Électronique
  - Outillage général
  - Nettoyage
  - Autre (à préciser)
- **Durée d'emprunt standard** : En jours (1-30)
- **Compartiment servante** : Position physique (ex: A1)
- **État initial** : Disponible
- **Image** : Photo de l'outil (JPEG/PNG, max 5 MB)

**Informations optionnelles :**
- Description détaillée
- Manuel d'utilisation (PDF)
- Accessoires inclus
- Valeur d'achat
- Date d'acquisition
- Fournisseur
- Numéro de série fabricant
- Nécessite formation : Oui/Non
- Remarques particulières

4. **Validez l'ajout**
5. **Imprimez l'étiquette QR code** générée automatiquement
6. **Collez l'étiquette** sur l'outil

#### 3. Configuration de la servante
1. Placez physiquement l'outil dans le compartiment assigné
2. Vérifiez que le capteur détecte bien la présence de l'outil
3. Testez un emprunt et un retour avec votre badge administrateur
4. Validez le bon fonctionnement

### Informations supplémentaires pour certains outils

**Outils numériques (avec batteries) :**
- Indiquez le type de batterie
- Précisez si un chargeur est inclus
- Ajoutez une procédure de recharge

**Outils de précision :**
- Indiquez la précision et l'étalonnage
- Définissez un intervalle d'étalonnage
- Ajoutez les certificats d'étalonnage

**Outils fragiles :**
- Cochez "Nécessite précautions"
- Ajoutez les instructions de manipulation
- Définissez des règles d'utilisation spécifiques

---

## ✏️ Modifier un Outil Existant

### Types de modifications possibles

#### Modifications simples
**Accessibles via l'interface web :**
1. Connectez-vous en tant qu'administrateur
2. Allez dans "Gestion des outils" → "Liste des outils"
3. Recherchez l'outil à modifier
4. Cliquez sur "Modifier"

**Champs modifiables :**
- Nom et description
- Catégorie
- Durée d'emprunt standard
- État actuel
- Image
- Documentation
- Remarques

5. Sauvegardez les modifications
6. Les changements sont effectifs immédiatement

#### Modifications techniques
**Nécessitent des droits super-administrateur :**
- Référence de l'outil
- Compartiment servante
- Configuration RFID/QR code

**Procédure :**
1. Contactez le support technique
2. Fournissez l'ancienne et la nouvelle valeur
3. Validez les tests après modification

### Changement d'état d'un outil

**États disponibles :**
- ✅ **Disponible** : L'outil peut être emprunté
- 🔴 **Emprunté** : En cours d'utilisation (géré automatiquement)
- 🔧 **Maintenance** : Outil en réparation ou révision
- ⚠️ **Maintenance préventive** : Étalonnage, vérification planifiée
- ❌ **Hors service** : Outil défectueux, à remplacer
- 📦 **En commande** : Outil commandé, pas encore reçu
- 🗄️ **Archivé** : Outil retiré du service

**Comment changer l'état :**
1. Sélectionnez l'outil
2. Cliquez sur "Changer l'état"
3. Sélectionnez le nouvel état
4. Ajoutez un commentaire expliquant le changement (obligatoire)
5. Indiquez une date de retour prévue (pour maintenance)
6. Validez

**Important :**
- Les utilisateurs sont notifiés automatiquement si un outil qu'ils ont réservé passe en maintenance
- L'historique des changements d'état est conservé
- Un outil en maintenance n'apparaît pas dans les résultats de recherche utilisateurs

---

## 🗑️ Supprimer un Outil

### Différence entre Archivage et Suppression

#### Archivage (recommandé)
**À utiliser pour :**
- Outils temporairement retirés
- Outils remplacés par une version plus récente
- Conservation de l'historique

**Procédure :**
1. Modifiez l'état de l'outil → "Archivé"
2. Ajoutez la raison de l'archivage
3. L'outil n'est plus visible pour les utilisateurs
4. L'historique est conservé
5. Peut être réactivé ultérieurement

#### Suppression définitive
**À utiliser uniquement pour :**
- Erreurs de saisie
- Doublons
- Outils jamais mis en service

**⚠️ ATTENTION : Cette action est irréversible**

**Conditions pour supprimer :**
- L'outil ne doit avoir aucun emprunt en cours
- L'outil ne doit avoir aucune réservation future
- Confirmation par deux administrateurs (pour outils avec historique)

**Procédure :**
1. Vérifiez que toutes les conditions sont remplies
2. Allez dans "Gestion des outils" → "Liste des outils"
3. Sélectionnez l'outil
4. Cliquez sur "Actions avancées" → "Supprimer définitivement"
5. Lisez l'avertissement
6. Cochez "Je comprends que cette action est irréversible"
7. Entrez le code de confirmation
8. Validez

**Que devient l'historique ?**
- Les emprunts passés sont anonymisés
- Les statistiques globales sont conservées
- La référence de l'outil est libérée après 30 jours

---

## 📂 Catégorisation des Outils

### Catégories principales

#### 1. Mesure Électrique
**Caractéristiques :**
- Nécessite souvent des batteries
- Peut nécessiter un étalonnage
- Durée d'emprunt : 5-7 jours
- Formation recommandée pour certains

**Outils inclus :**
- Pince ampèremétrique
- Multimètre
- Oscilloscope (si ajouté)
- Wattmètre (si ajouté)

#### 2. Mesure Mécanique
**Caractéristiques :**
- Outils de précision
- Étalonnage périodique nécessaire
- Durée d'emprunt : 7 jours

**Sous-catégories :**
- **Précision** : Outils numériques, étalonnage strict
- **Standard** : Outils mécaniques classiques

**Outils inclus :**
- Jauges (épaisseur, profondeur)
- Rapporteurs (standard et numérique)
- Inclinomètre
- Compas
- Équerre

#### 3. Électronique
**Caractéristiques :**
- Outils de montage et démontage
- Durée d'emprunt : 7-14 jours
- Souvent en jeux complets

**Outils inclus :**
- Jeu de tournevis d'électronique
- Pince à dénuder et sertir

#### 4. Outillage Général
**Caractéristiques :**
- Usage courant
- Durée d'emprunt : 14 jours
- Haute disponibilité

**Outils inclus :**
- Mètre ruban
- Ciseaux
- Mini brosse

#### 5. Nettoyage
**Caractéristiques :**
- Consommables ou semi-consommables
- Durée d'emprunt : 14 jours
- Vérification de l'état après chaque retour

**Outils inclus :**
- Mini brosse
- Chiffons (si ajoutés)

### Création d'une nouvelle catégorie

**Quand créer une nouvelle catégorie :**
- Plus de 5 outils du même type
- Règles de gestion spécifiques
- Besoin de statistiques séparées

**Procédure :**
1. Accédez à "Administration" → "Catégories d'outils"
2. Cliquez sur "Créer une catégorie"
3. Renseignez :
   - Nom de la catégorie
   - Description
   - Durée d'emprunt par défaut
   - Nombre maximum d'emprunts simultanés
   - Icône/couleur pour l'interface
   - Formation obligatoire : Oui/Non
4. Validez
5. Assignez les outils à cette nouvelle catégorie

---

## 📊 États des Outils - Gestion Détaillée

### État : Disponible ✅

**Description :**
- L'outil est en bon état de fonctionnement
- Il est physiquement dans la servante
- Il peut être emprunté immédiatement

**Transitions possibles :**
- → Emprunté (automatique lors d'un emprunt)
- → Maintenance (manuel par admin)
- → Hors service (manuel par admin)

**Actions automatiques :**
- Apparaît dans les résultats de recherche
- Peut être réservé
- Notifications envoyées aux utilisateurs en attente

---

### État : Emprunté 🔴

**Description :**
- Un utilisateur a emprunté l'outil
- Date de retour prévue enregistrée
- Suivi actif des retards

**Gestion automatique :**
- Passage automatique lors de l'emprunt
- Retour automatique lors du dépôt dans la servante
- Calcul automatique du temps d'emprunt

**Informations visibles :**
- Nom de l'emprunteur (pour admin uniquement)
- Date et heure d'emprunt
- Date de retour prévue
- Nombre de jours restants/retard

**Actions possibles (admin) :**
- Forcer le retour (cas exceptionnel)
- Prolonger l'emprunt
- Contacter l'emprunteur

---

### État : Maintenance 🔧

**Description :**
- L'outil nécessite une réparation
- L'outil est en cours de vérification
- L'outil nécessite un étalonnage

**Quand l'utiliser :**
- Suite à un signalement d'utilisateur
- Maintenance planifiée
- Après un incident

**Procédure de mise en maintenance :**
1. Changez l'état → "Maintenance"
2. Sélectionnez le type de maintenance :
   - Réparation
   - Étalonnage
   - Vérification
   - Nettoyage approfondi
   - Remplacement de batterie
3. Indiquez la date de retour prévue
4. Ajoutez des notes sur le problème
5. Assignez à un technicien (optionnel)

**Suivi de la maintenance :**
- Créer des tâches de maintenance
- Enregistrer les interventions
- Joindre des photos ou rapports
- Historique complet conservé

**Retour en service :**
1. Effectuez les tests de fonctionnement
2. Mettez à jour les notes de maintenance
3. Changez l'état → "Disponible"
4. Le système notifie automatiquement les utilisateurs en attente

---

### État : Maintenance Préventive ⚠️

**Description :**
- Maintenance planifiée à l'avance
- Pas de problème signalé
- Part d'un planning de maintenance

**Utilisation :**
- Étalonnage annuel des instruments de mesure
- Vérification périodique des outils numériques
- Remplacement préventif des batteries

**Planning de maintenance préventive :**
- Configurez un calendrier automatique
- Le système propose automatiquement les dates
- Notifications envoyées à l'avance aux administrateurs

---

### État : Hors Service ❌

**Description :**
- L'outil est définitivement endommagé
- Réparation impossible ou non rentable
- En attente de remplacement

**Quand l'utiliser :**
- Outil cassé de manière irréparable
- Coût de réparation > 70% du prix d'achat
- Outil obsolète à remplacer

**Procédure :**
1. Changez l'état → "Hors service"
2. Décrivez le problème
3. Indiquez si un remplacement est prévu
4. Retirez physiquement l'outil de la servante
5. Archivez ou supprimez après validation

**Gestion financière :**
- Enregistrez la perte
- Demandez un remplacement
- Mise à jour de l'inventaire

---

### État : En Commande 📦

**Description :**
- Outil commandé mais pas encore reçu
- Permet d'informer les utilisateurs

**Utilisation :**
- Nouvel outil commandé
- Remplacement d'un outil hors service
- Extension du parc d'outils

**Informations à renseigner :**
- Date de commande
- Fournisseur
- Numéro de commande
- Date de livraison prévue
- Prix d'achat

**Réception de l'outil :**
1. Vérifiez la conformité de la livraison
2. Testez le fonctionnement
3. Enregistrez les informations (numéro de série, garantie)
4. Changez l'état → "Disponible"
5. Placez dans la servante

---

### État : Archivé 🗄️

**Description :**
- Outil retiré du service actif
- Historique conservé
- Peut être réactivé

**Raisons courantes :**
- Outil remplacé par un modèle plus récent
- Baisse d'utilisation
- Réorganisation du catalogue
- Changement de stratégie

**Conservation des données :**
- Historique complet des emprunts
- Statistiques d'utilisation
- Photos et documentation
- Peut être consulté par les admins

**Réactivation :**
1. Localisez l'outil archivé
2. Vérifiez son état physique
3. Testez le fonctionnement
4. Changez l'état → "Disponible"
5. Assignez un nouveau compartiment si nécessaire

---

## 📈 Statistiques et Rapports

### Rapports disponibles

**1. Taux d'utilisation par outil**
- Nombre d'emprunts par période
- Durée moyenne d'emprunt
- Taux de disponibilité
- Identification des outils peu utilisés

**2. Rapport de maintenance**
- Nombre d'interventions par outil
- Coût total de maintenance
- Temps moyen de réparation
- Outils nécessitant le plus de maintenance

**3. Statistiques utilisateurs**
- Emprunts par utilisateur
- Retards par utilisateur
- Outils les plus empruntés par catégorie d'utilisateur

**4. Analyse financière**
- Valeur totale du parc d'outils
- Coût de maintenance par outil
- ROI (retour sur investissement)
- Prévisions de remplacement

### Export des données
- Format CSV pour Excel
- Format PDF pour rapports
- Génération automatique mensuelle
- Envoi par email aux administrateurs

---

## 🔒 Sécurité et Traçabilité

### Traçabilité complète

**Chaque action est enregistrée :**
- Qui a ajouté/modifié/supprimé l'outil
- Date et heure de l'action
- Anciennes et nouvelles valeurs
- Raison du changement

**Consultation de l'historique :**
1. Sélectionnez un outil
2. Cliquez sur "Historique"
3. Filtrez par type d'action ou date
4. Exportez si nécessaire

### Sauvegarde et restauration

**Sauvegarde automatique :**
- Quotidienne à 2h00 du matin
- Conservation de 30 jours
- Stockage sécurisé

**Restauration d'urgence :**
- Contactez le support technique
- Indiquez la date de restauration souhaitée
- Validation par un super-administrateur requise
