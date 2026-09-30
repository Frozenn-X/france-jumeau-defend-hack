# FranceJumeau

> 🏆 **Premier prix du Defend Hack 2** -- VivaTech 2026

FranceJumeau est un prototype de **jumeau numérique interactif du système énergétique français**. Il aide à explorer le territoire, le mix électrique et les données de réseau à travers une carte et des tableaux de bord conçus pour rendre un système complexe plus lisible.

Le projet a remporté le premier prix du Defend Hack 2. Le palmarès décrit une carte permettant de lire l'énergie sur le territoire français quasi en temps réel et souligne la lisibilité de l'interface. La preuve est disponible dans le [palmarès officiel de Defend Hack 2](https://anisayari.com/fr/blog/defend-hack-2-gagnants-hackathon-energie).

## Ce que permet l'application

- Explorer une carte interactive de la France aux niveaux national, régional et métropolitain.
- Consulter le mix de production, la consommation, l'intensité carbone et le signal Ecowatt.
- Visualiser les capacités installées, les sites de production et des indicateurs territoriaux.
- Mettre en regard des données électriques avec des paramètres météo utiles aux analyses énergétiques.
- Parcourir des vues pédagogiques pour transformer des données de réseau en informations compréhensibles.

## Données et principes

FranceJumeau utilise volontairement **uniquement des données publiques, gratuites et accessibles sans clé API**. Le projet s'appuie notamment sur :

- les jeux de données RTE et ODRÉ (production, consommation, mix, intensité carbone, Ecowatt, capacités et données territoriales) ;
- Open-Meteo pour les variables météo ;
- des données locales ou agrégées par le serveur lorsque cela améliore la lecture de l'interface.

Ce choix rend le prototype reproductible et évite de dépendre d'un compte payant, d'un quota privé ou d'un secret stocké côté serveur.

## Limites importantes

FranceJumeau est un projet de hackathon et un outil **d'exploration**, pas un système de conduite du réseau électrique.

- Certaines vues sont quasi temps réel, mais la fraîcheur des données dépend des sources publiques, de leur cadence de publication et du cache applicatif.
- Les appels à plusieurs APIs peuvent demander quelques secondes au premier chargement, ou être ralentis/indisponibles selon les fournisseurs de données.
- Certaines représentations utilisent des estimations, des données de démonstration ou des simulations afin d'explorer des scénarios. Elles ne doivent pas être interprétées comme des mesures opérationnelles certifiées.
- Les données publiques peuvent être corrigées, modifiées ou retirées par leurs producteurs ; une analyse critique et une vérification à la source restent nécessaires.

## Stack technique

- **Frontend :** React, Vite, MapLibre GL, D3 et TanStack Query.
- **Backend :** Node.js et Express.
- **Données :** APIs publiques RTE/ODRÉ et Open-Meteo.
- **Approche :** projet conçu en *full vibe coding* pendant le hackathon, avec une exigence de lisibilité, de traçabilité des sources et de reproductibilité.

## Démarrer localement

```bash
npm install
npm run server
```

Dans un second terminal :

```bash
npm run dev
```

L'interface Vite est alors disponible localement ; le serveur Node fournit les routes d'agrégation de données.

## Crédits

Projet créé par **Xavier Trauchessec** pour le Defend Hack 2, organisé par Defend Intelligence avec le soutien d'OpenAI et d'Engie.

