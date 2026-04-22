# Authentification et Gestion des Accès

## 🔐 Système d'Authentification

### Types de Comptes Utilisateurs

#### 1. Utilisateur Standard (User)
**Caractéristiques :**
- Compte par défaut pour tous les étudiants et personnel
- Accès limité aux fonctionnalités d'emprunt
- Besoin de validation pour l'activation

**Droits d'accès :**
- ✅ Emprunter des outils (max 5 simultanément)
- ✅ Consulter le catalogue
- ✅ Réserver des outils
- ✅ Prolonger ses emprunts
- ✅ Consulter son historique
- ✅ Signaler des problèmes
- ❌ Accès aux fonctions administratives
- ❌ Modification du catalogue
- ❌ Gestion des autres utilisateurs

#### 2. Utilisateur Privilégié (Power User)
**Caractéristiques :**
- Personnel enseignant, chercheurs, techniciens
- Limites d'emprunt augmentées
- Accès prioritaire

**Droits d'accès :**
- ✅ Emprunter jusqu'à 10 outils simultanément
- ✅ Durée d'emprunt étendue (+50%)
- ✅ Réservation anticipée (7 jours au lieu de 3)
- ✅ Priorité sur les réservations en cas de conflit
- ✅ Accès à des outils réservés (selon configuration)
- ❌ Fonctions administratives

#### 3. Gestionnaire (Manager)
**Caractéristiques :**
- Personnel technique du laboratoire
- Gestion opérationnelle quotidienne
- Support de premier niveau

**Droits d'accès :**
- ✅ Tous les droits utilisateur
- ✅ Visualiser tous les emprunts en cours
- ✅ Forcer le retour d'un outil (cas exceptionnel)
- ✅ Mettre un outil en maintenance
- ✅ Gérer les signalements
- ✅ Voir les statistiques d'utilisation
- ✅ Contacter les utilisateurs
- ❌ Modification du catalogue d'outils
- ❌ Gestion des utilisateurs
- ❌ Configuration système

#### 4. Administrateur (Admin)
**Caractéristiques :**
- Responsables du laboratoire
- Gestion complète du système
- Accès à toutes les fonctionnalités

**Droits d'accès :**
- ✅ Tous les droits Manager
- ✅ Ajouter/modifier/supprimer des outils
- ✅ Gérer les utilisateurs et leurs rôles
- ✅ Configurer le système d'emprunt
- ✅ Consulter tous les logs
- ✅ Générer des rapports avancés
- ✅ Gérer les pénalités et exceptions
- ✅ Configurer les notifications
- ❌ Accès super-administrateur

#### 5. Super-Administrateur (Super Admin)
**Caractéristiques :**
- Direction du laboratoire, service informatique
- Accès technique complet
- Gestion de la configuration système

**Droits d'accès :**
- ✅ Tous les droits Administrateur
- ✅ Configuration avancée du système
- ✅ Gestion de la servante (paramètres techniques)
- ✅ Sauvegarde et restauration
- ✅ Accès aux logs système complets
- ✅ Modification des règles de sécurité
- ✅ Gestion des intégrations (API, LDAP)
- ⚠️ Actions auditées et tracées

---

## 📝 Création et Activation de Comptes

### Processus d'Inscription Utilisateur

#### Méthode 1 : Auto-inscription (si activée)
**Étapes pour l'utilisateur :**
1. Accéder à la page d'inscription : `https://emprunt-labo.exemple.fr/inscription`
2. Remplir le formulaire :
   - Prénom et Nom
   - Adresse email institutionnelle (@université.fr)
   - Numéro d'étudiant ou de personnel
   - Département/Laboratoire
   - Numéro de téléphone (optionnel mais recommandé)
   - Mot de passe (minimum 8 caractères, avec majuscules, minuscules et chiffres)
   - Confirmation du mot de passe
3. Accepter les conditions d'utilisation
4. Cliquer sur "Créer mon compte"

**Validation automatique :**
- Un email de confirmation est envoyé à l'adresse fournie
- L'utilisateur doit cliquer sur le lien dans les 48 heures
- Le compte est activé automatiquement pour les adresses email validées
- Le badge doit être enregistré lors de la première visite au laboratoire

**Validation manuelle :**
- Si l'email n'est pas dans le domaine autorisé
- Un administrateur reçoit une notification
- Validation sous 1-2 jours ouvrés
- L'utilisateur reçoit un email de confirmation

#### Méthode 2 : Création par un Administrateur
**Étapes pour l'administrateur :**
1. Se connecter avec un compte Admin
2. Aller dans "Gestion des utilisateurs" → "Ajouter un utilisateur"
3. Remplir le formulaire :
   - Informations personnelles (nom, prénom, email)
   - Numéro d'identification (étudiant/personnel)
   - Rôle (User, Power User, Manager, Admin)
   - Département
   - Date d'expiration du compte (optionnel)
   - Notes internes (optionnel)
4. Choisir le mode d'activation :
   - **Envoi automatique** : L'utilisateur reçoit un email avec lien d'activation et création de mot de passe
   - **Activation immédiate** : Mot de passe généré automatiquement et envoyé par email
   - **Activation différée** : Compte créé mais inactif, activation manuelle ultérieure

#### Méthode 3 : Import en masse (CSV)
**Pour les administrateurs :**
1. Télécharger le modèle CSV depuis "Gestion des utilisateurs" → "Import"
2. Remplir le fichier avec les informations requises :
   - email, prenom, nom, role, departement, numero_badge
3. Importer le fichier
4. Vérifier les erreurs éventuelles
5. Valider l'import
6. Emails d'activation envoyés automatiquement à tous les utilisateurs

**Format CSV attendu :**
```csv
email,prenom,nom,role,departement,numero_badge,telephone
jean.dupont@univ.fr,Jean,Dupont,user,Informatique,123456789,0612345678
marie.martin@univ.fr,Marie,Martin,power_user,Electronique,987654321,0698765432
```

---

### Enregistrement du Badge RFID

**Processus :**
1. L'utilisateur doit se présenter au laboratoire avec :
   - Sa pièce d'identité
   - Son badge étudiant/personnel
   - Preuve de l'activation de son compte (email)

2. Un administrateur ou gestionnaire :
   - Vérifie l'identité de la personne
   - Scanne le badge sur le lecteur d'enregistrement
   - Associe le badge au compte utilisateur dans le système
   - Teste le fonctionnement avec la servante

3. L'utilisateur peut immédiatement emprunter des outils

**En cas de badge non fonctionnel :**
- Vérification de la puce RFID
- Émission d'un nouveau badge si nécessaire
- Frais éventuels selon la politique de l'établissement

---

## 🔑 Gestion des Mots de Passe

### Politique de Sécurité des Mots de Passe

**Exigences minimales :**
- Longueur minimum : 8 caractères
- Au moins une lettre majuscule
- Au moins une lettre minuscule
- Au moins un chiffre
- Caractères spéciaux recommandés (!@#$%^&*)
- Ne doit pas être identique aux 3 derniers mots de passe
- Ne doit pas contenir le nom ou l'email de l'utilisateur

**Durée de validité :**
- **Utilisateurs standard** : 365 jours (renouvellement annuel)
- **Administrateurs** : 90 jours (renouvellement trimestriel)
- Notification de renouvellement 15 jours avant expiration

**Sécurité :**
- Stockage avec hachage bcrypt
- Salage unique pour chaque mot de passe
- Protection contre les attaques par force brute
- Historique des mots de passe conservé (hash uniquement)

---

### Récupération de Mot de Passe Oublié

#### Procédure Standard
**Étape 1 : Demande de réinitialisation**
1. L'utilisateur va sur la page de connexion
2. Clique sur "Mot de passe oublié ?"
3. Entre son adresse email institutionnelle
4. Soumet la demande

**Étape 2 : Réception du lien**
- Un email est envoyé immédiatement (vérifier les spams)
- Contient un lien de réinitialisation sécurisé
- Le lien est valable 24 heures uniquement
- Utilisation unique (expire après utilisation)

**Étape 3 : Création du nouveau mot de passe**
1. Cliquer sur le lien reçu par email
2. Entrer un nouveau mot de passe
3. Confirmer le nouveau mot de passe
4. Validation et confirmation

**Étape 4 : Connexion**
- Connexion immédiate possible avec le nouveau mot de passe
- Email de confirmation de changement envoyé
- L'ancien mot de passe est immédiatement invalidé

**Sécurité :**
- Si l'email n'existe pas dans le système, aucun message d'erreur précis (protection contre l'énumération)
- Message générique : "Si cette adresse existe, un email a été envoyé"
- Limitation du nombre de demandes : maximum 3 par heure

---

#### Procédure d'Urgence (sans email)

**Cas d'usage :**
- L'utilisateur n'a plus accès à son email
- Le compte email est bloqué ou supprimé
- Urgence nécessitant un accès immédiat

**Procédure :**
1. Se présenter physiquement au laboratoire avec une pièce d'identité
2. Expliquer la situation à un administrateur
3. Vérification de l'identité (pièce d'identité + vérification dans le système)
4. L'administrateur génère un nouveau mot de passe temporaire
5. L'utilisateur doit changer ce mot de passe lors de sa première connexion

**Traçabilité :**
- Toute réinitialisation manuelle est enregistrée
- Nom de l'administrateur qui a effectué l'opération
- Date et heure
- Raison de la réinitialisation manuelle

---

### Changement de Mot de Passe

#### Changement Volontaire
**Procédure :**
1. Se connecter au compte
2. Aller dans "Mon compte" → "Sécurité"
3. Cliquer sur "Changer le mot de passe"
4. Entrer l'ancien mot de passe (pour vérification)
5. Entrer le nouveau mot de passe
6. Confirmer le nouveau mot de passe
7. Valider

**Après le changement :**
- Email de confirmation envoyé
- Toutes les sessions actives sont déconnectées (sauf session courante)
- Nécessite de se reconnecter sur les autres appareils

#### Changement Forcé (par Admin)
**Cas d'usage :**
- Suspicion de compromission du compte
- Demande de l'utilisateur sans accès email
- Compte inactif depuis longtemps

**Procédure pour l'admin :**
1. Aller dans "Gestion des utilisateurs"
2. Rechercher l'utilisateur
3. Cliquer sur "Actions" → "Réinitialiser le mot de passe"
4. Choisir :
   - Génération automatique + envoi par email
   - Génération automatique + fourniture en personne
5. Valider

**Pour l'utilisateur :**
- Reçoit un email avec mot de passe temporaire
- Doit changer le mot de passe lors de la première connexion
- L'ancien mot de passe est invalidé

---

## 👥 Gestion des Rôles et Permissions

### Attribution et Modification de Rôles

#### Procédure d'Attribution (par Admin)
**Étapes :**
1. Se connecter en tant qu'Administrateur
2. Aller dans "Gestion des utilisateurs"
3. Rechercher l'utilisateur concerné
4. Cliquer sur "Modifier"
5. Sélectionner le nouveau rôle dans le menu déroulant
6. Ajouter une justification (obligatoire)
7. Valider

**Notifications :**
- L'utilisateur reçoit un email l'informant du changement de rôle
- Description des nouvelles permissions
- Date effective du changement

**Validation :**
- Les changements vers Admin ou Super Admin nécessitent validation par un Super Admin existant
- Double authentification requise pour ces changements critiques

---

### Restrictions et Règles Spéciales

#### Compte avec Restrictions Temporaires
**Cas d'usage :**
- Utilisateur avec historique de retards
- Période probatoire après réactivation
- Utilisateur en formation

**Restrictions possibles :**
- Limitation du nombre d'emprunts (ex: 2 au lieu de 5)
- Durée d'emprunt réduite (ex: 3 jours au lieu de 7)
- Interdiction d'emprunter certains types d'outils
- Obligation de valider chaque emprunt par un gestionnaire

**Configuration :**
1. Aller dans le profil de l'utilisateur
2. Section "Restrictions et exceptions"
3. Cocher les restrictions à appliquer
4. Définir la date de fin (optionnel)
5. Ajouter un commentaire justificatif
6. Valider

#### Exceptions et Autorisations Spéciales
**Cas d'usage :**
- Projet spécial nécessitant plus d'outils
- Besoin de garder un outil plus longtemps
- Accès à des outils normalement réservés

**Procédure :**
1. L'utilisateur fait une demande via le formulaire de contact
2. Justification du besoin
3. Un administrateur évalue la demande
4. Accord ou refus motivé
5. Si accord : création d'une exception temporaire dans le système

**Traçabilité :**
- Toutes les exceptions sont enregistrées
- Durée limitée (max 30 jours)
- Renouvellement possible sur demande
- Révision mensuelle par les administrateurs

---

## 🔒 Sécurité et Traçabilité

### Audit et Logs

#### Événements Enregistrés
**Actions utilisateurs :**
- Connexion/Déconnexion (avec IP)
- Emprunts et retours
- Tentatives de connexion échouées
- Changements de mot de passe
- Modifications de profil

**Actions administratives :**
- Création/Modification/Suppression de comptes
- Changements de rôles
- Modifications du catalogue
- Réinitialisations de mots de passe
- Accès aux données sensibles

**Événements système :**
- Pannes de la servante
- Erreurs d'authentification
- Accès non autorisés (tentatives)
- Modifications de configuration

#### Consultation des Logs
**Pour les Administrateurs :**
1. Aller dans "Administration" → "Logs et Audit"
2. Filtrer par :
   - Type d'événement
   - Utilisateur
   - Période
   - Niveau de sévérité
3. Exporter en CSV si nécessaire

**Rétention des données :**
- Logs de connexion : 90 jours
- Logs d'emprunts : 2 ans
- Logs administratifs : 5 ans
- Logs de sécurité : 7 ans (obligation légale)

---

### Double Authentification (2FA)

#### Configuration (Recommandé pour Admins)
**Activation :**
1. Aller dans "Mon compte" → "Sécurité"
2. Cliquer sur "Activer la double authentification"
3. Choisir la méthode :
   - Application TOTP (Google Authenticator, Authy)
   - SMS (moins sécurisé)
4. Scanner le QR code avec l'application
5. Entrer le code généré pour valider
6. Sauvegarder les codes de récupération (important !)

**Utilisation :**
- À chaque connexion, après le mot de passe
- Entrer le code à 6 chiffres généré par l'application
- Option "Me faire confiance pendant 30 jours" sur appareil personnel

**Codes de Récupération :**
- 10 codes générés lors de l'activation
- À utiliser si perte du téléphone
- Chaque code utilisable une seule fois
- Possibilité de régénérer de nouveaux codes

#### Obligation pour Certains Rôles
**2FA Obligatoire pour :**
- Administrateurs
- Super-Administrateurs

**2FA Recommandée pour :**
- Gestionnaires
- Power Users

**Délai d'activation :**
- 7 jours de grâce après promotion à Admin
- Compte bloqué si non activé après ce délai

---

### Protection Contre les Accès Non Autorisés

#### Détection des Comportements Suspects
**Alertes automatiques :**
- Connexions depuis plusieurs pays en peu de temps
- Nombreuses tentatives de connexion échouées (>5 en 15 minutes)
- Changement brutal du comportement d'emprunt
- Accès à des heures inhabituelles (pour les administrateurs)

**Actions automatiques :**
- Blocage temporaire du compte (30 minutes)
- Notification à l'administrateur
- Email d'alerte à l'utilisateur
- Demande de changement de mot de passe à la prochaine connexion

#### Gestion des Sessions
**Durée de session :**
- Utilisateurs : 8 heures d'inactivité
- Administrateurs : 2 heures d'inactivité
- Session maintenue si activité

**Déconnexion :**
- Automatique après la durée d'inactivité
- Possibilité de "Rester connecté" (30 jours, uniquement sur appareil personnel)
- Déconnexion de toutes les sessions en cas de changement de mot de passe

---

## 🔧 Configuration Technique (Super-Admin)

### Intégration LDAP/Active Directory

**Avantages :**
- Authentification unifiée avec le SI de l'université
- Synchronisation automatique des utilisateurs
- Gestion centralisée des mots de passe

**Configuration :**
1. Aller dans "Configuration système" → "Authentification"
2. Activer l'intégration LDAP
3. Renseigner :
   - Serveur LDAP (ldap://ldap.univ.fr)
   - Port (389 ou 636 pour LDAPS)
   - Base DN (ou=users,dc=univ,dc=fr)
   - Compte de service (DN et mot de passe)
   - Filtre de recherche
4. Tester la connexion
5. Configurer le mapping des attributs :
   - email → mail
   - nom → sn
   - prénom → givenName
   - département → ou
6. Activer la synchronisation automatique
7. Définir la fréquence de synchronisation (ex: quotidienne à 2h00)

**Synchronisation :**
- Création automatique des comptes utilisateurs
- Mise à jour des informations personnelles
- Désactivation des comptes supprimés du LDAP
- Préservation des données d'emprunt locales

---

### Single Sign-On (SSO)

**Protocoles supportés :**
- SAML 2.0
- OAuth 2.0
- OpenID Connect

**Configuration SAML :**
1. Obtenir les métadonnées du fournisseur d'identité (IdP)
2. Importer dans "Configuration système" → "SSO"
3. Configurer les attributs (email, nom, prénom)
4. Télécharger les métadonnées du Service Provider (SP)
5. Les fournir à l'IdP
6. Tester l'authentification
7. Activer pour tous les utilisateurs

**Avantages :**
- Connexion unique pour tous les services de l'université
- Gestion des sessions centralisée
- Meilleure sécurité
- Expérience utilisateur améliorée

---

## 📊 Statistiques d'Utilisation par Rôle

### Rapports Disponibles

#### Pour Super-Admin
**Dashboard complet :**
- Nombre d'utilisateurs par rôle
- Taux d'utilisation du système
- Statistiques de connexion
- Performance du système
- Détection d'anomalies

**Rapports personnalisables :**
- Export de toutes les données
- Création de rapports sur mesure
- Planification d'envois automatiques

---

## 🆘 Support et Assistance

### Aide aux Utilisateurs
**Support de premier niveau :**
- FAQ automatisée
- Chatbot pour questions courantes
- Base de connaissances

**Support de deuxième niveau :**
- Email : support-labo@exemple.fr
- Téléphone : +33 X XX XX XX XX (heures ouvrées)
- Ticket de support en ligne

**Support de troisième niveau :**
- Pour les administrateurs uniquement
- Support technique avancé
- Assistance sur les intégrations

---

## 📋 Checklist de Sécurité

### Pour les Utilisateurs
- [ ] Utiliser un mot de passe fort et unique
- [ ] Activer la double authentification (si possible)
- [ ] Ne jamais partager son mot de passe ou son badge
- [ ] Se déconnecter sur les ordinateurs partagés
- [ ] Vérifier l'URL avant de se connecter
- [ ] Signaler immédiatement toute activité suspecte

### Pour les Administrateurs
- [ ] Activer obligatoirement la double authentification
- [ ] Changer le mot de passe tous les 90 jours
- [ ] Consulter régulièrement les logs de sécurité
- [ ] Effectuer des audits mensuels des permissions
- [ ] Former les nouveaux administrateurs
- [ ] Maintenir la documentation à jour
- [ ] Tester régulièrement les procédures de récupération
- [ ] Surveiller les tentatives d'accès non autorisées
