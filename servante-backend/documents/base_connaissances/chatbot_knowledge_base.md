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
- "Puis-je emprunter le pied à coulisse ?"
- "Y a-t-il une perceuse disponible ?"
- "Quels outils de coupe sont disponibles maintenant ?"

**Réponse fournie :**
- Statut actuel (Disponible / Emprunté / Maintenance)
- Si emprunté : date de retour prévue
- Si en maintenance : durée estimée
- Alternatives similaires disponibles

---

#### Informations sur les Outils
**Questions supportées :**
- "À quoi sert un pied à coulisse ?"
- "Comment utiliser le dénudeur automatique ?"
- "Quelle est la durée d'emprunt pour la perceuse ?"
- "Quelle est la différence entre la mini pince coupante et la pince coupante ?"
- "Quel tournevis choisir pour une vis cruciforme ?"

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
- Outil défectueux (ex : perceuse ne démarre pas, multimètre sans affichage)
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
- "Comment signaler que la perceuse ne charge plus ?"

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
- "Quelle est la différence entre la pince à dénuder et le dénudeur automatique ?"
- "Dois-je utiliser la mini pince coupante ou la pince coupante ?"
- "Quelle clé pour une vis six pans creux ?"
- "Tournevis plat ou américain pour ma vis ?"

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

### Scénario 2 : Choisir le Bon Outil de Dénudage

**Conversation type :**
```
User: Je veux dénuder des câbles, quel outil prendre ?
Bot: Il y a deux options disponibles selon votre besoin :

🔹 Pince à dénuder (T1-005) — Tiroir 1
   Usage : dénudage manuel, contrôle total de la profondeur
   Durée d'emprunt : 7 jours | ✅ Disponible

🔹 Dénudeur automatique (T3-001) — Tiroir 3
   Usage : dénudage rapide et précis, s'adapte au diamètre du fil
   Durée d'emprunt : 7 jours | ✅ Disponible

👉 Si vous traitez beaucoup de fils ou voulez aller vite → Dénudeur automatique
👉 Si vous souhaitez un contrôle précis ou travaillez sur peu de fils → Pince à dénuder

Souhaitez-vous réserver l'un des deux ?
```

---

### Scénario 3 : Problème avec un Outil

**Conversation type :**
```
User: La perceuse que j'ai empruntée ne démarre plus
Bot: Je suis désolé que vous rencontriez ce problème. Voici quelques vérifications rapides :

Avez-vous vérifié :
- La batterie est-elle correctement insérée ou chargée ?
- Le bouton de sécurité est-il déverrouillé ?
- Y a-t-il un témoin lumineux qui clignote ?

⚠️ Si l'outil ne fonctionne pas malgré ces vérifications :
1. Connectez-vous sur le site web
2. Dans "Mes emprunts en cours", cliquez sur la perceuse
3. Cliquez sur "Signaler un problème"
4. Sélectionnez "Ne fonctionne pas" et décrivez le problème

Voulez-vous que je crée un ticket de support maintenant ?
```

---

### Scénario 4 : Prolongation d'Emprunt

**Conversation type :**
```
User: Puis-je prolonger mon emprunt du pied à coulisse ?
Bot: Je vérifie votre emprunt...

Emprunt actuel :
- Outil : Pied à coulisse
- Date d'emprunt : 20/04/2026
- Date de retour : 25/04/2026 (dans 3 jours)
- Prolongations utilisées : 0/2

✅ Oui, vous pouvez prolonger cet emprunt !
- Prolongation disponible : +2 jours
- Nouvelle date de retour : 27/04/2026
- Il vous restera 1 prolongation après celle-ci

Souhaitez-vous prolonger maintenant ?
[Oui, prolonger] [Plus tard]

Note : Aucune réservation en attente pour cet outil.
```

---

### Scénario 5 : Choisir la Bonne Pince

**Conversation type :**
```
User: J'ai besoin d'une pince mais je ne sais pas laquelle choisir
Bot: Pas de problème ! Voici un résumé des pinces disponibles selon votre usage :

✂️ Pour couper :
- Mini pince coupante (T3-002) → fils fins, composants
- Pince coupante (T3-004) → câbles plus épais

🔩 Pour saisir et tenir :
- Mini pince à bec plat (T1-002) → petites pièces, précision
- Mini pince à bec rond (T1-003) → cintrage de fils fins
- Pince à bec plat (T1-004) → usage général
- Pince universelle (T3-005) → polyvalente (saisir, tordre, couper)

📐 Pour les espaces difficiles d'accès :
- Pince à bec coudée (T3-006)
- Mini pince à bec demi-rond coudée (T3-003)

Quel est votre usage précis ?
```

---

## 🔄 Intégration avec les Systèmes

### Connexion en Temps Réel

**Le chatbot se connecte à :**
1. **Base de données des outils** — disponibilité en temps réel, statut, dates de retour
2. **Compte utilisateur** — emprunts, historique, permissions
3. **Système de réservation** — créer, consulter, annuler des réservations
4. **Base de connaissances** — documentation, FAQs, guides

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
- Données d'autres utilisateurs
- Logs système détaillés

---

### Limitations Volontaires

**Pour protéger les utilisateurs :**
- Le chatbot ne demande JAMAIS de mot de passe
- Le chatbot ne peut pas désactiver un compte
- Le chatbot ne peut pas supprimer l'historique d'emprunts

---

## 📞 Escalade vers Support Humain

### Quand Escalader

**Le chatbot transfère vers un humain quand :**
- La question est trop complexe
- Décision administrative nécessaire
- Problème technique non résolu (ex : perceuse en panne)
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

## 📖 Glossaire pour le Chatbot

**Termes clés que le chatbot doit reconnaître :**

- **Servante** = Robot / Distributeur automatique d'outils
- **Badge** = Carte RFID / Carte étudiant / Carte de labo
- **Emprunt** = Prêt / Location (bien que gratuit)
- **Retour** = Rendu / Restitution
- **Prolongation** = Extension / Renouvellement
- **Maintenance** = Réparation / Indisponible / En panne
- **Disponible** = Libre / Accessible
- **Tiroir** = Compartiment / Case / Emplacement
- **Réservation** = Réserver à l'avance / Bloquer
- **Pénalité** = Sanction / Retard / Blocage

**Synonymes et variantes d'outils :**
- Multimètre = Testeur / Voltmètre
- Tournevis américain = Tournevis cruciforme / Tournevis Phillips
- Tournevis plat = Tournevis à tête fendue
- Clé L = Clé Allen / Clé hexagonale / Clé six pans
- Pied à coulisse = Vernier / Calibre
- Cutteur = Cutter / Couteau à lame rétractable
- Dénudeur automatique = Dénude-câble automatique / Stripper automatique
- Pince universelle = Pince multiprise / Pince multifonction
- Pince à bec plat = Pince plate
- Pince coupante = Pince diagonale / Pince coupe-fil

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

---

**Dernière mise à jour :** Avril 2026
**Prochaine révision :** Juillet 2026
