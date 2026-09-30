# Nouvelles Sources de Données Référencées : État d'Implémentation

Ce document dresse l'état d'avancement des nouvelles sources de données complémentaires proposées pour le projet.

---

## 1. Source de Données Intégrée : Sous-catégories Hydrauliques (Eau)

Le seul nouveau flux de données opérationnel est le **détail de la production hydroélectrique (Eau)**, extrait du flux existant `eco2mix-national-tr`.

*   **Identifiant / Dataset** : `eco2mix-national-tr`
*   **Variables** : `hydraulique_lacs`, `hydraulique_fil_eau_eclusee`, `hydraulique_step_turbinage`
*   **Statut** : **ACTIF & IMPLÉMENTÉ dans le code**.
*   **Usage** : Affiché en détail dans le panneau de capacité [CapacityPanel.jsx](file:///home/frozen/df-energie/src/components/Panels/CapacityPanel.jsx) et le graphique de mix [EnergyMixDonut.jsx](file:///home/frozen/df-energie/src/components/Panels/EnergyMixDonut.jsx).

---

## 2. Autres Sources Explorées mais NON Utilisées (Planifiées / Futures)

Conformément à l'audit du code, **aucun des flux suivants n'est implémenté ou utilisé dans la base de code active**. Ils restent répertoriés à titre de planification théorique pour de futures évolutions :

### A. Indisponibilités et Pannes Réelles des Centrales (RTE REMIT API)
*   **API** : `Unavailability Additional Information` (v6) sur RTE Portail Data
*   **Statut dans le code** : **NON IMPLÉMENTÉ**. La carte géographique simule le statut de fonctionnement des centrales nucléaires de manière déterministe.

### B. Fréquence en Temps Réel du Réseau Synchrone (API RTE)
*   **Dataset ODRÉ** : `frequence-reseau-temps-reel`
*   **Statut dans le code** : **NON IMPLÉMENTÉ**. La fréquence réseau européenne n'est pas suivie en direct dans la barre de KPI.

### C. Données Énergétiques Européennes Completes (ENTSO-E API Portal)
*   **API** : `ENTSO-E Transparency Platform API`
*   **Statut dans le code** : **NON IMPLÉMENTÉ**. Les importations et exportations de l'application s'appuient uniquement sur le solde national global de `eco2mix-national-tr`.

### D. Prévisions de Consommation et de Production (RTE & Open-Meteo)
*   **Dataset** : `eco2mix-national-consommation-realisee-previsions` de RTE
*   **Statut dans le code** : **NON IMPLÉMENTÉ**. Les graphiques affichent les courbes historiques et actuelles mais ne projettent pas la prévision officielle de RTE à J+1.

### E. Prix Spot Réels de Gros Européens (EPEX Spot API / Scraping)
*   **API** : `day-ahead-prices` sur ENTSO-E
*   **Statut dans le code** : **NON IMPLÉMENTÉ**. Le prix spot affiché est estimé dynamiquement via des règles heuristiques de *Merit Order* calculées en local dans `App.jsx`.
