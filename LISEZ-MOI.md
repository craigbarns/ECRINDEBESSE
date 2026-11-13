# Écrin de Besse — Site vitrine

## Modifier le site (Laetitia)

Rendez-vous sur **https://ecrindebesse.netlify.app/admin**, connectez-vous avec votre e-mail, choisissez une section, modifiez textes ou photos puis cliquez sur **Publier**. Le site se met à jour tout seul en 1 à 2 minutes.

- Mettre un mot entre `*étoiles*` l'écrit en italique doré dans les titres.
- Un retour à la ligne dans un titre crée un saut de ligne ; une ligne vide dans un texte crée un nouveau paragraphe.
- Les photos envoyées sont automatiquement redimensionnées et allégées.

## Fonctionnement technique

- `content/*.json` : tous les textes et photos (modifiés par l'admin Decap CMS).
- `src/page.hbs` : modèle de la page ; `build.js` assemble le site dans `dist/` (Netlify lance `npm run build`).
- `admin/` : interface d'administration (Decap CMS, connexion Netlify Identity + Git Gateway).
- `assets/uploads/` : photos envoyées depuis l'admin.

Mise en route Netlify : Site configuration → Identity → Enable ; Registration → Invite only ; Services → Git Gateway → Enable ; puis Invite users avec l'e-mail de Laetitia.

---


Site statique (HTML/CSS/JS, sans compilation). Publication Netlify : dossier publié = racine du dépôt (voir `netlify.toml`).

Version 2 : `upgrade.css` et `upgrade.js` ajoutent la neige animée, le header givré, le bandeau défilant, la mosaïque voyageurs, les décorations à thème (onglets + glisser au doigt), la section entretien, le menu mobile plein écran et la barre d'appel flottante.

Site réalisé à partir du brief de Laetitia, des deux logos et des captures Wix du dossier fourni. Les originaux sont conservés.

## Consulter le site

Ouvrir `index.html` dans un navigateur. Aucune installation ni compilation nécessaire : les images, les polices et les scripts sont locaux.

Pour un aperçu avec serveur local, depuis ce dossier :

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Puis ouvrir http://localhost:4173. Le serveur lancé pendant la réalisation sert uniquement le sous-dossier `site`, et non les documents originaux.

## Ce qui est livré

- Design adapté aux téléphones et ordinateurs, palette sapin / ivoire / champagne, polices Cormorant et Manrope hébergées localement.
- Parcours propriétaires et voyageurs, services détaillés, courses au drive, décorations à thème, entretien technique, histoire, secteurs et FAQ.
- Menu mobile, accordéons accessibles au clavier, liens téléphone et e-mail, demandes préremplies selon le service.
- Préparation d’un e-mail avec validation des champs, aperçu du message et copie. **Le site ne transmet pas lui-même d’e-mail.** Le visiteur l’envoie avec sa messagerie. Aucun service serveur de formulaire n’est configuré.
- Images WebP optimisées, description de référencement et métadonnées de partage à finaliser avec le domaine de publication.
- Captures et compte rendu de vérification dans `verification`.

## Choix retenus

Logo sur fond vert : une composition plus sobre et plus lisible dans la navigation que le sceau rond. Le logo d’origine a été conservé sans redessin.

Coordonnées de la carte, confirmées par Grégory : **06 19 32 75 81** et **contact@ecrindebesse.fr**.

Tarifs présentés **sur devis**, car aucune grille n’a été fournie. Aucun avis client, chiffre de performance ou tarif inventé.

Le partenariat de plomberie, chauffage et multiservices est présenté sans mention d’un lien familial.

## Avant publication publique

Renseigner l’identité juridique, l’adresse professionnelle, les références d’immatriculation et les informations de publication/hébergement dans la fenêtre d’informations légales. Ces données n’ont pas été fournies et ne sont pas inventées. Finaliser le texte de confidentialité selon l’hébergement et le traitement réel des demandes.

Choisir l’hébergeur et le domaine, puis définir les URLs absolues des métadonnées de partage et l’URL canonique. Vérifier la réception de `contact@ecrindebesse.fr`. Pour recevoir les demandes directement depuis le site sans passer par la messagerie du visiteur, raccorder un service de formulaire et adapter le message de confirmation.

Le site n’a pas été publié en ligne. Les images de chalets et d’intérieurs sont des ambiances illustratives, pas un inventaire de locations.

## Fichiers à modifier

- `index.html` : textes, coordonnées, prestations et fenêtres d’information.
- `styles.css` : identité visuelle et affichage mobile.
- `app.js` : navigation et préparation des demandes.
- `assets/` : visuels et polices. Les licences des polices sont incluses.

## Provenance des images

`assets/logo.png` : logo vert fourni. `assets/interieur.webp`, `assets/bienvenue.webp` et `assets/sancy.webp` : extraction des visuels des captures PDF fournies. Leur définition est limitée par les captures d’origine ; des originaux haute définition pourront les remplacer.

`assets/chalet-hiver.webp` : visuel généré avec l’outil intégré image_gen, puis optimisé pour le web. Prompt de génération : chalet authentique et modeste en pierre et bois auvergnat sur la moitié droite d’une composition panoramique ; sapins et neige ; montagnes volcaniques arrondies du massif du Sancy, sans sommets alpins abrupts ; fin de journée bleutée, fenêtres ambre, chemin accueillant ; espace plus calme à gauche pour le texte ; photographie architecturale éditoriale réaliste ; sans personnes, voitures, texte, logo ni filigrane.

## Vérifications et limites

Rendu inspecté dans Chromium à 1440 × 900 et 390 × 844, y compris les sections sous la ligne de flottaison. Navigation au clavier, validation, préremplissage, fenêtre de demande, lien mailto, accordéons et absence de débordement vérifiés. Copie réussie et indisponibilité du presse-papiers vérifiées avec simulations contrôlées, sans écraser le presse-papiers personnel ni envoyer de message.

La règle de réduction des mouvements a été inspectée dans la feuille de style chargée. Aucun test sur appareil physique, Safari ou messagerie externe n’a été réalisé. La livraison est une version locale autonome, pas un déploiement public.
