# 🌳 Commandes Git pour la branche MINA

## ✅ Validation de la branche actuelle

```bash
# Vérifier la branche actuelle
git branch --show-current
# Devrait afficher: mina

# Voir le statut
git status
```

---

## 📦 Commit des changements

```bash
# Ajouter tous les fichiers modifiés
git add .

# Ou ajouter sélectivement
git add servante-backend/src/routes/hardwareRoutes.ts
git add servante-backend/prisma/schema.prisma
git add RFID_INTEGRATION_COMPLETE.md
git add test-rfid-flow.js
git add BRANCH_MINA_README.md

# Créer un commit avec message descriptif
git commit -m "feat: Implémentation complète authentification RFID

- Ajout endpoint POST /api/hardware/rfid pour auth par badge
- Nouveau modèle RFIDAttempt pour logging des tentatives
- Protection anti-bruteforce (10 tentatives/min)
- Génération JWT automatique si badge autorisé
- Tests automatisés (test-rfid-flow.js)
- Documentation complète (RFID_INTEGRATION_COMPLETE.md)

Phases complétées: 1-6 du plan RFID
Prêt pour Phase 7 (Tests & validation)"

# Voir l'historique des commits
git log --oneline -5
```

---

## 🔄 Synchronisation avec le dépôt distant

```bash
# Pousser la branche vers le dépôt distant
git push origin mina

# Si c'est la première fois
git push -u origin mina

# Forcer le push (⚠️ à utiliser avec précaution)
git push --force origin mina
```

---

## 🔀 Fusion avec main/master

### Option 1: Merge depuis main
```bash
# Aller sur main
git checkout main

# Mettre à jour main
git pull origin main

# Fusionner mina dans main
git merge mina

# Pousser
git push origin main
```

### Option 2: Pull Request (recommandé)
```bash
# Pousser votre branche
git push origin mina

# Ensuite sur GitHub/GitLab:
# 1. Créer une Pull Request
# 2. De: mina → Vers: main
# 3. Ajouter description et reviewers
# 4. Merger après approbation
```

---

## 📊 Voir les différences

```bash
# Différences entre mina et main
git diff main..mina

# Fichiers modifiés
git diff --name-only main..mina

# Statistiques
git diff --stat main..mina
```

---

## 🔍 Historique et logs

```bash
# Voir l'historique de la branche
git log --oneline --graph --all

# Commits sur mina pas sur main
git log main..mina --oneline

# Qui a modifié quoi
git log --pretty=format:"%h - %an, %ar : %s"
```

---

## 🏷️ Créer un tag (version)

```bash
# Tag pour la version RFID
git tag -a v1.0.0-rfid -m "Version 1.0.0 - Intégration RFID complète"

# Voir les tags
git tag

# Pousser les tags
git push origin --tags
```

---

## 🔙 Annuler des changements

### Annuler le dernier commit (garder les changements)
```bash
git reset --soft HEAD~1
```

### Annuler le dernier commit (supprimer les changements)
```bash
git reset --hard HEAD~1
```

### Annuler un fichier spécifique
```bash
git checkout -- servante-backend/src/routes/hardwareRoutes.ts
```

---

## 🌿 Gestion des branches

```bash
# Lister toutes les branches
git branch -a

# Créer une nouvelle branche depuis mina
git checkout -b mina-hotfix

# Supprimer une branche locale
git branch -d nom-branche

# Supprimer une branche distante
git push origin --delete nom-branche

# Renommer la branche actuelle
git branch -m nouveau-nom
```

---

## 🔄 Stash (sauvegarder temporairement)

```bash
# Sauvegarder les changements non commités
git stash

# Voir la liste des stash
git stash list

# Récupérer le dernier stash
git stash pop

# Appliquer un stash spécifique
git stash apply stash@{0}
```

---

## 📝 Commandes utiles avant commit

```bash
# Vérifier les fichiers modifiés
git status

# Voir les changements ligne par ligne
git diff

# Voir les changements des fichiers staged
git diff --staged

# Ajouter interactivement
git add -p
```

---

## 🎯 Workflow complet recommandé

```bash
# 1. Vérifier que vous êtes sur mina
git branch --show-current

# 2. Voir ce qui a changé
git status
git diff

# 3. Ajouter les fichiers
git add .

# 4. Commit avec message descriptif
git commit -m "feat: Votre message"

# 5. Pousser vers le dépôt distant
git push origin mina

# 6. Créer une Pull Request sur GitHub/GitLab
# (via l'interface web)
```

---

## 🛠️ Résolution de conflits

```bash
# Si conflit lors du merge
git status  # Voir les fichiers en conflit

# Éditer les fichiers manuellement
# Chercher les marqueurs: <<<<<<<, =======, >>>>>>>

# Une fois résolu
git add fichier-résolu.ts
git commit -m "fix: Résolution conflits merge"
```

---

## 📋 Checklist avant push

- [ ] `git status` - Vérifier les fichiers modifiés
- [ ] Tests passés (`node test-rfid-flow.js`)
- [ ] Pas d'erreurs de compilation
- [ ] Message de commit descriptif
- [ ] Documentation mise à jour
- [ ] Pas de fichiers sensibles (.env, credentials)

---

## 🔐 Fichiers à NE PAS commiter

Assurez-vous que `.gitignore` contient:
```
node_modules/
.env
.env.local
*.log
dist/
build/
.DS_Store
```

---

## 💡 Bonnes pratiques

1. **Commits atomiques** - Un commit = une fonctionnalité
2. **Messages clairs** - Utiliser le format: `type: description`
   - `feat:` - Nouvelle fonctionnalité
   - `fix:` - Correction de bug
   - `docs:` - Documentation
   - `refactor:` - Refactoring
   - `test:` - Tests
3. **Pull avant push** - Toujours synchroniser avant de pousser
4. **Branches courtes** - Fusionner régulièrement
5. **Review code** - Utiliser les Pull Requests

---

## 📚 Ressources Git

- [Git Documentation](https://git-scm.com/doc)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**Astuce:** Créez un alias pour les commandes fréquentes:
```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
```
