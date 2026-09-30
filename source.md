# Registre des Données Externes et APIs Référencées

Ce document répertorie l'ensemble des **sources de données et APIs externes** (RTE, ODRÉ, Open-Meteo) exploitées par le projet, documente l'intégration du nouveau flux de données hydroélectriques fines, et dresse le bilan d'utilisation des flux planifiés.

> [!IMPORTANT]
> **Ce registre ne répertorie que les APIs et jeux de données externes officiels.** Toute route d'API interne ou service d'agrégation local (`/api/...`) a été exclu afin de préserver la lisibilité de la chaîne d'approvisionnement des données brutes.

---

## 1. Jeux de Données Actuellement Exploités et Intégrés dans le Code

L'application interroge les APIs publiques et datasets suivants, stockés ou servis par le serveur et le client :

### A. Plateforme ODRÉ (Open Data Réseau Électricité) / RTE API
*   **URL API de base** : `https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets`
*   **Format** : JSON (ODRÉ API v2.1)

| Dataset ID ODRÉ | Variables clés exploitées | Fichiers & Composants d'Utilisation | Statut & Rôle dans l'application |
| :--- | :--- | :--- | :--- |
| **`eco2mix-national-tr`** | `consommation`, `nucleaire`, `eolien`, `solaire`, `gaz`, `charbon`, `fioul`, `bioenergies`, `ech_physiques` | - [rteService.js](file:///home/frozen/df-energie/server/services/rteService.js#L29-L39)<br>- [localDb.js](file:///home/frozen/df-energie/server/db/localDb.js)<br>- [useEnergyData.js](file:///home/frozen/df-energie/src/hooks/useEnergyData.js)<br>- [App.jsx](file:///home/frozen/df-energie/src/App.jsx) | **Actif & Utilisé** : Mix de production et consommation nationale en temps réel. Alimente les KPIs et les graphiques globaux. |
| **`eco2mix-regional-tr`** | `consommation`, `production`, `nucleaire`, `eolien`, `solaire`, `hydraulique`, `thermique`, `bioenergies` | - [rteService.js](file:///home/frozen/df-energie/server/services/rteService.js#L41-L51)<br>- [useEnergyData.js](file:///home/frozen/df-energie/src/hooks/useEnergyData.js)<br>- [EnergyMapLayer.jsx](file:///home/frozen/df-energie/src/components/Map/EnergyMapLayer.jsx)<br>- [RegionEnergyExplainer.jsx](file:///home/frozen/df-energie/src/components/Panels/RegionEnergyExplainer.jsx) | **Actif & Utilisé** : Cartographie régionale interactive temps réel et fiches de focus régionaux. |
| **`part-enr-intensite-ges-conso-tr`** | `taux_co2` (gCO₂eq/kWh) | - [rteService.js](file:///home/frozen/df-energie/server/services/rteService.js#L84-L88)<br>- [useCarbonData.js](file:///home/frozen/df-energie/src/hooks/useCarbonData.js)<br>- [KPIBar.jsx](file:///home/frozen/df-energie/src/components/Panels/KPIBar.jsx) | **Actif & Utilisé** : Intensité carbone nationale affichée dans la barre KPI. |
| **`signal-ecowatt`** | `valeur` (1: Vert, 2: Orange, 3: Rouge) par tranche horaire | - [rteService.js](file:///home/frozen/df-energie/server/services/rteService.js#L90-L94)<br>- [useEcowatt.js](file:///home/frozen/df-energie/src/hooks/useEcowatt.js)<br>- [EcowattBadge.jsx](file:///home/frozen/df-energie/src/components/Panels/EcowattBadge.jsx) | **Actif & Utilisé** : Niveau de tension réseau et alertes de délestage en direct. |
| **`eco2mix-metropoles-tr`** | `libelle_metropole`, `consommation`, `production`, `echanges_physiques` | - [rteService.js](file:///home/frozen/df-energie/server/services/rteService.js#L115-L119)<br>- [useMetropoles.js](file:///home/frozen/df-energie/src/hooks/useMetropoles.js)<br>- [MetropoleDetail.jsx](file:///home/frozen/df-energie/src/components/Panels/MetropoleDetail.jsx) | **Actif & Utilisé** : Consommation et solde local des 21 métropoles sous l'onglet Expert. |
| **`registre-national-...`** *(registre-national-installation-production-stockage-electricite-agrege-311224)* | `puismaxinstallee`, `filiere`, `coderegion` | - [rteService.js](file:///home/frozen/df-energie/server/services/rteService.js#L108-L113)<br>- [useInstallations.js](file:///home/frozen/df-energie/src/hooks/useInstallations.js)<br>- [PlantMarkers.jsx](file:///home/frozen/df-energie/src/components/Map/PlantMarkers.jsx)<br>- [RegionEnergyExplainer.jsx](file:///home/frozen/df-energie/src/components/Panels/RegionEnergyExplainer.jsx) | **Actif & Utilisé** : Capacités installées et nombre de sites de production en service par filière et région. |
| **`postes-electriques-rte`** | `coordonnees`, `tension`, `etat`, `nom_poste`, `departement` | - [rteService.js](file:///home/frozen/df-energie/server/services/rteService.js#L121-L125)<br>- [GridOverlay.jsx](file:///home/frozen/df-energie/src/components/Map/GridOverlay.jsx) | **Actif & Utilisé** : Affichage géographique des lignes et postes THT (400kV / 225kV) sur la carte. |
| **`parc-prod-par-filiere`** | `parc_nucleaire`, `parc_eolien`, `parc_solaire`, `parc_hydraulique`, `parc_thermique_fossile`, `parc_bioenergie`, `annee` | - [rteService.js](file:///home/frozen/df-energie/server/services/rteService.js#L127-L131)<br>- [CapacityPanel.jsx](file:///home/frozen/df-energie/src/components/Panels/CapacityPanel.jsx) | **Actif & Utilisé** : Capacités annuelles historiques installées en France pour le calcul des taux de charge. |

### B. Météo et Paramètres Climatiques (API Open-Meteo)
*   **URL API de base** : `https://api.open-meteo.com/v1/forecast`
*   **Fichiers d'Utilisation** : [weatherService.js](file:///home/frozen/df-energie/server/services/weatherService.js), [useWeatherData.js](file:///home/frozen/df-energie/src/hooks/useWeatherData.js), [WeatherCorrelation.jsx](file:///home/frozen/df-energie/src/components/Panels/WeatherCorrelation.jsx).

| Paramètre API | Unité | Rôle dans les corrélations climat-énergie |
| :--- | :--- | :--- |
| **`temperature_2m`** | °C | Mesure de la thermosensibilité (chauffage/climatisation impactant la conso). |
| **`wind_speed_10m`** & **`wind_speed_100m`** | km/h | Taux de charge théorique et conditions des turbines éoliennes. |
| **`cloud_cover`** | % | Couverture nuageuse affectant la production solaire. |
| **`shortwave_radiation`** | W/m² | Irradiation solaire globale pour l'évaluation de la production photovoltaïque. |

---

## 2. Intégration Détaillée du Nouveau Flux Hydroélectrique (Eau)

Pour améliorer la précision et la transparence des ressources en eau, nous avons intégré les **sous-catégories hydrauliques fines** issues de la télémétrie de `eco2mix-national-tr` :

*   **`hydraulique_lacs`** : Production des réservoirs de montagnes (barrages-lacs). *Capacité installée estimée : **8 200 MW**.*
*   **`hydraulique_fil_eau_eclusee`** : Production hydroélectrique au fil de l'eau. *Capacité installée estimée : **12 500 MW**.*
*   **`hydraulique_step_turbinage`** : Stations de Transfert d'Énergie par Pompage (mode turbinage). *Capacité installée estimée : **5 000 MW**.*

### Fichiers impactés par cette intégration :
1.  [CapacityPanel.jsx](file:///home/frozen/df-energie/src/components/Panels/CapacityPanel.jsx) : Le panneau affiche désormais le taux de charge individuel de chaque filière hydraulique au lieu de regrouper le tout sous une jauge "Hydraulique" générique.
2.  [EnergyMixDonut.jsx](file:///home/frozen/df-energie/src/components/Panels/EnergyMixDonut.jsx) : Le mix énergétique national (et le mode simulation) détaille la part de chaque sous-catégorie hydraulique, avec couleurs dédiées.

---

## 3. Bilan de Non-Utilisation / Suppression des Autres Flux

Conformément aux directives d'assainissement du code, les flux et API non utilisés dans l'application ont été identifiés ou nettoyés du code :

### A. Flux et Endpoints Supprimés de la Base de Code
*   **`temperature-quotidienne-regionale` (ODRÉ)** :
    *   *Statut* : **Entièrement Supprimé**.
    *   *Action* : Le hook client `useTemperature.js` a été supprimé. L'endpoint `/api/energy/temperature` dans `server/index.js` et la méthode `getRegionalTemperature` dans `server/services/rteService.js` ont été supprimés.
    *   *Raison* : L'application utilise les données météo en temps réel d'Open-Meteo pour les analyses climatiques, rendant ce jeu de données historique quotidien obsolète.
*   **`registre-national-...` (Variante brute non agrégée)** :
    *   *Statut* : **Supprimé du serveur**.
    *   *Action* : La méthode `getInstallationsRegistry()` dans `server/services/rteService.js` a été supprimée car seule `getInstallationsByRegion()` est requise par l'application.

### B. Audit des flux décrits dans `new-source.md` (Planifiés mais non implémentés)
Afin d'éviter toute confusion entre le plan et le code réel, ces sources sont classées comme **Non implémentées dans le code** (planification théorique uniquement) :
1.  **RTE REMIT API** *(Indisponibilités de centrales)* : **Non utilisé**. Le statut des réacteurs reste simulé sur la carte.
2.  **Fréquence réseau en temps réel** (`frequence-reseau-temps-reel`) : **Non utilisé**.
3.  **ENTSO-E API** *(Flux européens)* : **Non utilisé**.
4.  **Prévisions RTE J+1** (`eco2mix-national-consommation-realisee-previsions`) : **Non utilisé**.
5.  **EPEX Spot API** *(Prix du marché)* : **Non utilisé** (le prix spot est estimé via une formule mathématique locale dans `App.jsx`).
6.  **ADEME Base Carbone** *(Empreinte Carbone cycle de vie)* : **Non utilisé** (les intensités carbone directes en direct de RTE restent la seule référence).
7.  **Enedis Production Communale** (`production-electrique-par-filiere-a-la-maille-commune`) : **Non utilisé**.
8.  **GRTgaz Flux Physiques** (`flux-physiques-historiques-grtgaz`) : **Non utilisé**.
