# Base de Connaissances - Chatbot Servante

## 🤖 À Propos du Chatbot

### Rôle et Fonctionnalités

**Le chatbot est conçu pour :**
- Répondre aux questions fréquentes sur le système d'emprunt
- Guider les utilisateurs dans leurs démarches
- Fournir des informations en temps réel sur les outils
- Orienter vers les ressources appropriées
- Traiter les demandes simples automatiquement

**Le chatbot NE PEUT PAS :**
- Effectuer des emprunts à votre place (utilisez la servante ou le site web)
- Modifier votre compte ou vos permissions
- Traiter les paiements ou facturation
- Prendre des décisions administratives complexes

---

## 🔍 Capacités du Chatbot

### Recherche et Information

#### Disponibilité des Outils
**Questions supportées :**
- "Le multimètre est-il disponible ?"
- "Quand puis-je emprunter la pince ampèremétrique ?"
- "Y a-t-il des tournevis disponibles ?"
- "Quels outils de mesure électrique sont disponibles maintenant ?"

**Réponse fournie :**
- Statut actuel (Disponible / Emprunté / Maintenance)
- Si emprunté : date de retour prévue
- Si en maintenance : durée estimée
- Alternatives similaires disponibles

---

#### Informations sur les Outils
**Questions supportées :**
- "À quoi sert un inclinomètre numérique ?"
- "Comment utiliser le multimètre ?"
- "Quelle est la durée d'emprunt pour la pince ampèremétrique ?"
- "Où trouver le manuel du rapporteur d'angle numérique ?"

**Réponse fournie :**
- Description de l'outil
- Usage principal
- Durée d'emprunt standard
- Lien vers la documentation complète
- Vidéos tutorielles si disponibles

---

#### Statut des Emprunts
**Questions supportées :**
- "Quels outils ai-je emprunté ?"
- "Quand dois-je retourner mes outils ?"
- "Ai-je des outils en retard ?"
- "Puis-je prolonger mon emprunt du multimètre ?"

**Réponse fournie :**
- Liste de vos emprunts en cours
- Dates de retour
- Possibilité de prolongation
- Lien direct pour prolonger sur le site web

---

### Procédures et Aide

#### Guidage Étape par Étape
**Le chatbot peut guider pour :**
- Emprunter un outil via la servante
- Retourner un outil
- Créer un compte
- Réserver un outil
- Signaler un problème
- Récupérer un mot de passe

**Format de réponse :**
1. Liste numérotée claire
2. Une étape par message (pour les processus complexes)
3. Possibilité de demander des précisions sur chaque étape
4. Liens vers des tutoriels vidéo si disponibles

---

#### Résolution de Problèmes
**Problèmes traités :**
- Badge ne fonctionne pas
- Servante affiche une erreur
- Impossible de se connecter
- Outil défectueux
- Compartiment bloqué
- Prolongation refusée

**Approche de résolution :**
1. Diagnostic rapide par questions
2. Solutions immédiates si possible
3. Escalade vers un humain si nécessaire
4. Création automatique de ticket si complexe

---

## 💬 Types de Questions Reconnues

### Questions sur les Horaires
**Exemples :**
- "À quelle heure ouvre le laboratoire ?"
- "Le labo est-il ouvert le samedi ?"
- "Quels sont les horaires pendant les vacances ?"
- "Jusqu'à quelle heure puis-je emprunter ?"

**Informations fournies :**
- Horaires actuels (selon le jour et la période)
- Horaires spéciaux (vacances, examens)
- Exceptions et fermetures

---

### Questions sur les Limites
**Exemples :**
- "Combien d'outils puis-je emprunter ?"
- "Quelle est la durée maximale d'emprunt ?"
- "Puis-je emprunter 3 multimètres ?"
- "Combien de fois puis-je prolonger ?"

**Réponse basée sur :**
- Votre rôle (User, Power User, etc.)
- Type d'outil concerné
- Règles spécifiques applicables

---

### Questions sur les Procédures
**Exemples :**
- "Comment créer un compte ?"
- "Comment réinitialiser mon mot de passe ?"
- "Comment enregistrer mon badge ?"
- "Comment signaler un outil cassé ?"

**Réponse :**
- Guide pas à pas
- Prérequis nécessaires
- Liens vers formulaires ou pages appropriées
- Contacts si aide humaine nécessaire

---

### Questions sur les Pénalités
**Exemples :**
- "Que se passe-t-il si je suis en retard ?"
- "J'ai un outil en retard, que faire ?"
- "Combien coûte un badge perdu ?"
- "Vais-je être sanctionné si l'outil était déjà cassé ?"

**Réponse :**
- Explication claire du système de pénalités
- Conséquences selon le niveau de retard
- Possibilités de justification
- Procédure de régularisation

---

### Questions Comparatives
**Exemples :**
- "Quelle est la différence entre un rapporteur standard et numérique ?"
- "Dois-je choisir la pince ampèremétrique ou le multimètre ?"
- "Quel outil pour mesurer un angle ?"

**Réponse :**
- Comparaison des caractéristiques
- Avantages et inconvénients
- Recommandation selon l'usage
- Disponibilité de chaque option

---

## 🎯 Scénarios d'Usage Typiques

### Scénario 1 : Nouvel Utilisateur

**Conversation type :**
```
User: Je suis nouveau, comment ça marche ?
Bot: Bienvenue ! Pour emprunter des outils, vous devez :
1. Créer un compte sur notre site web
2. Faire enregistrer votre badge au laboratoire
3. Utiliser votre badge sur la servante pour emprunter

Avez-vous déjà créé votre compte ?

User: Non, pas encore
Bot: Voici comment créer votre compte :
1. Allez sur la page de connexion
2. Cliquez sur "S'inscrire"
3. Utilisez votre email institutionnel (@université.fr)
4. Créez un mot de passe sécurisé
5. Vérifiez votre email pour activer le compte

Une fois activé, présentez-vous au labo avec votre badge pour l'enregistrer.

Horaires : Lundi-Vendredi 8h-18h, Samedi 9h-12h

Besoin d'autres informations ?
```

---

### Scénario 2 : Recherche d'Outil Disponible

**Conversation type :**
```
User: J'ai besoin d'un multimètre
Bot: Je vérifie la disponibilité des multimètres...

✅ Bonne nouvelle ! Nous avons 2 multimètres disponibles :
- Multimètre #1 (Compartiment A4)
- Multimètre #2 (Compartiment A5)

Durée d'emprunt : 7 jours
Prolongation possible : Oui (2 fois, +3 jours chaque)

Pour l'emprunter :
1. Venez au laboratoire (horaires : Lun-Ven 8h-18h)
2. Scannez votre badge sur la servante
3. Sélectionnez "Multimètre" à l'écran
4. Récupérez l'outil dans le compartiment indiqué

Voulez-vous réserver un multimètre pour plus tard ?
```

---

### Scénario 3 : Problème avec un Outil

**Conversation type :**
```
User: Le multimètre que j'ai emprunté ne s'allume plus
Bot: Je suis désolé que vous rencontriez ce problème. C'est important de le signaler rapidement.

⚠️ NE CONTINUEZ PAS à utiliser l'outil

Voici ce que vous devez faire :
1. Allez sur le site web et connectez-vous
2. Dans "Mes emprunts en cours", cliquez sur le multimètre
3. Cliquez sur "Signaler un problème"
4. Sélectionnez "Ne fonctionne pas"
5. Décrivez le problème (prenez des photos si possible)

Avez-vous vérifié :
- Les piles sont-elles en place ?
- Y a-t-il un fusible à vérifier ?
- L'interrupteur fonctionne-t-il ?

Voulez-vous que je crée un ticket pour vous maintenant ?
```

---

### Scénario 4 : Prolongation d'Emprunt

**Conversation type :**
```
User: Puis-je prolonger mon emprunt du jeu de tournevis ?
Bot: Je vérifie votre emprunt...

Emprunt actuel :
- Outil : Jeu de tournevis d'électronique
- Date d'emprunt : 10/02/2026
- Date de retour : 24/02/2026 (dans 10 jours)
- Prolongations utilisées : 0/2

✅ Oui, vous pouvez prolonger cet emprunt !
- Prolongation disponible : +3 jours
- Nouvelle date de retour : 27/02/2026
- Il vous restera 1 prolongation après celle-ci

Souhaitez-vous prolonger maintenant ? 
[Oui, prolonger] [Plus tard]

Note: Aucune réservation en attente pour cet outil.
```

---

## 🔄 Intégration avec les Systèmes

### Connexion en Temps Réel

**Le chatbot se connecte à :**
1. **Base de données des outils**
   - Disponibilité en temps réel
   - Statut de chaque outil
   - Dates de retour prévues

2. **Compte utilisateur**
   - Emprunts en cours
   - Historique
   - Permissions et rôle
   - Restrictions éventuelles

3. **Système de réservation**
   - Créer des réservations
   - Consulter les réservations futures
   - Annuler des réservations

4. **Base de connaissances**
   - Documentation des outils
   - FAQs
   - Guides et tutoriels

---

### Actions Automatisables

**Le chatbot peut automatiquement :**
- Consulter la disponibilité des outils
- Afficher le statut de vos emprunts
- Créer des alertes de disponibilité
- Générer des liens directs vers les pages concernées
- Créer des tickets de support
- Envoyer des notifications

**Le chatbot NE PEUT PAS automatiquement :**
- Effectuer des emprunts (nécessite badge physique)
- Modifier des permissions utilisateur
- Annuler des pénalités
- Accéder aux données d'autres utilisateurs

---

## 🎓 Apprentissage et Amélioration

### Analyse des Conversations

**Le système analyse :**
- Questions les plus fréquentes
- Taux de résolution au premier contact
- Sujets nécessitant escalade vers humain
- Clarté des réponses

**Amélioration continue :**
- Ajout de nouvelles réponses aux questions courantes
- Amélioration des guides existants
- Optimisation du temps de réponse
- Personnalisation selon le profil utilisateur

---

### Feedback Utilisateur

**Après chaque conversation :**
- "Cette réponse vous a-t-elle aidé ?" 👍 👎
- Option de laisser un commentaire
- Suggestion d'amélioration
- Signalement si réponse incorrecte

**Utilisation du feedback :**
- Corrections immédiates si erreur détectée
- Ajout de précisions si réponse incomplète
- Mise à jour de la base de connaissances
- Formation continue du modèle

---

## 🔒 Confidentialité et Sécurité

### Protection des Données

**Le chatbot :**
- Ne stocke pas les conversations indéfiniment (30 jours max)
- Ne partage jamais vos informations avec des tiers
- Chiffre toutes les communications
- Respecte le RGPD

**Informations accessibles au chatbot :**
- Votre profil utilisateur (nom, email, rôle)
- Vos emprunts en cours et historique
- Vos réservations
- Statut de votre compte

**Informations NON accessibles :**
- Mot de passe (jamais stocké en clair)
- Numéro de carte bancaire (si paiements)
- Données d'autres utilisateurs
- Logs système détaillés

---

### Limitations Volontaires

**Pour protéger les utilisateurs :**
- Le chatbot ne demande JAMAIS de mot de passe
- Le chatbot ne demande JAMAIS d'informations bancaires
- Le chatbot ne peut pas désactiver un compte
- Le chatbot ne peut pas supprimer l'historique d'emprunts

**En cas de demande suspecte :**
Le chatbot refuse et signale l'administrateur si quelqu'un essaie de :
- Accéder aux données d'autres utilisateurs
- Modifier des permissions de manière frauduleuse
- Contourner les règles du système

---

## 📞 Escalade vers Support Humain

### Quand Escalader

**Le chatbot transfère vers un humain quand :**
- La question est trop complexe
- Décision administrative nécessaire
- Problème technique non résolu
- Utilisateur insatisfait de la réponse
- Urgence détectée
- Situation exceptionnelle

**Processus d'escalade :**
1. Le chatbot explique qu'un humain va prendre le relais
2. Résumé de la conversation transmis
3. Création automatique d'un ticket
4. Notification envoyée à l'équipe support
5. L'utilisateur reçoit un numéro de ticket

---

### Continuité du Service

**Pendant l'escalade :**
- Temps d'attente estimé communiqué
- Possibilité de continuer par email ou téléphone
- L'historique de conversation est préservé
- Suivi automatique jusqu'à résolution

**Après résolution :**
- Notification de clôture du ticket
- Demande de satisfaction
- Mise à jour de la base de connaissances si nécessaire

---

## 🌐 Multilingue (Futur)

### Langues Supportées (Prévision)

**Actuellement :**
- Français uniquement

**En développement :**
- Anglais (Q3 2026)
- Arabe (Q4 2026)
- Espagnol (2027)

**Fonctionnalités multilingues :**
- Détection automatique de la langue
- Traduction des réponses en temps réel
- Documentation traduite
- Support technique dans la langue choisie

---

## 📊 Statistiques d'Utilisation

### Métriques Suivies

**Performance du chatbot :**
- Temps de réponse moyen : < 2 secondes
- Taux de résolution au premier contact : 78%
- Satisfaction utilisateur : 4.2/5
- Conversations par jour : ~150

**Questions les plus fréquentes :**
1. Disponibilité d'un outil spécifique (35%)
2. Procédures d'emprunt (20%)
3. Problèmes techniques (15%)
4. Informations sur les horaires (12%)
5. Gestion de compte (10%)
6. Autres (8%)

---

## 🚀 Évolutions Futures

### Fonctionnalités Prévues

**Court terme (2026) :**
- Reconnaissance vocale
- Suggestions proactives d'outils
- Intégration avec calendrier (rappels)
- Notifications push

**Moyen terme (2027) :**
- Assistant virtuel complet
- Analyse prédictive de disponibilité
- Recommandations personnalisées
- Tutoriels interactifs intégrés

**Long terme :**
- Réalité augmentée pour guider dans le laboratoire
- IA pour diagnostiquer les pannes d'outils
- Gestion vocale complète de la servante
- Intégration avec assistants vocaux (Alexa, Google Home)

---

## 📖 Glossaire pour le Chatbot

**Termes clés que le chatbot doit reconnaître :**

- **Servante** = Robot / Distributeur automatique d'outils
- **Badge** = Carte RFID / Carte étudiant / Carte de labo
- **Emprunt** = Prêt / Location (bien que gratuit)
- **Retour** = Rendu / Restitution
- **Prolongation** = Extension / Renouvellement
- **Maintenance** = Réparation / Indisponible / En panne
- **Disponible** = Libre / Accessible
- **Compartiment** = Tiroir / Case / Emplacement
- **Réservation** = Réserver à l'avance / Bloquer
- **Pénalité** = Sanction / Retard / Blocage

**Synonymes d'outils :**
- Multimètre = Testeur / Voltmètre
- Pince ampèremétrique = Pince de courant
- Tournevis = Screwdriver
- Compas = Compas de menuisier
- Jauge = Calibre

---

## ✅ Checklist pour Nouveaux Contenus

**Avant d'ajouter une nouvelle réponse, vérifier :**
- [ ] La réponse est-elle claire et concise ?
- [ ] Contient-elle des étapes numérotées si nécessaire ?
- [ ] Les liens sont-ils à jour ?
- [ ] La réponse est-elle cohérente avec les autres docs ?
- [ ] Y a-t-il des exemples concrets ?
- [ ] Les termes techniques sont-ils expliqués ?
- [ ] La réponse anticipe-t-elle les questions de suivi ?
- [ ] Le ton est-il amical et professionnel ?
