# Backlog mobile

Ce qui a été **constaté sur appareil réel** et qui attend la passe de design
mobile. Rien de ce qui figure ici ne doit être corrigé à l'aveugle dans le code :
l'écran sera redessiné, et une correction faite en amont serait à refaire.

**Propriétaire : Moula Raoul.** Voir la décision d'architecture au § 9 du
[plan directeur](plan-directeur.md) — *desktop d'abord, mobile par le design*.

---

## Ouvert

### M1 · Le pupitre couvre 57 % de la hauteur

**Constaté** le 30/08/2026, Infinix Smart8 sous Chrome, portrait.
Mesures sur 375 × 812 : en-tête 67 px, **pupitre 461 px**, bande visible 284 px.

Cinq cartes empilées, neuf commandes offertes simultanément — le principe 6
(« une idée forte par écran ») n'est pas tenu en format étroit. La correction du
moteur (`reserver()`, commit `928dc3c`) compose avec la contrainte ; elle ne la
lève pas.

*Intrant disponible :* maquette d'un pupitre pliable produite le 30/08/2026 —
essentiel visible (cas, décomposer, écartement), reste sous un volet ; pupitre
ramené à ~128 px, figure portée de 35 % à 80 % de l'écran. Deux points y restent
à trancher : la remontée de la ligne-clé dans la bande visible au moment où elle
se révèle, et le seuil de pliage (proposé : sous 500 px de hauteur utile, la
hauteur manquant plus que la largeur).

### M2 · La figure dévie à droite et se fait rogner par le bord

**Constaté** le 30/08/2026, Infinix Smart8 sous Chrome, portrait, après le
correctif `928dc3c`. La correction verticale agit — la figure remonte bien dans
la bande visible — mais le centrage **horizontal** dérape en format étroit réel.

Non reproduit en format simulé 375 × 812 sur poste de bureau : comme pour M1, la
simulation de format ne suffit pas. Cause non établie, et **volontairement non
cherchée** : l'écran sera redessiné, la géométrie du cadre changera, et
diagnostiquer sur l'ancienne mise en page reviendrait à instruire un dossier
périmé.

*À reprendre après la passe de design*, sur la nouvelle mise en page, avec un
relevé de `moteur.zoneUtile()` fait sur l'appareil lui-même.

---

## Méthode retenue

Les deux constats partagent la même leçon : **un format simulé sur poste de
bureau ne remplace pas l'appareil.** Polices, barre d'adresse, hauteur réelle des
bandeaux et marges du navigateur diffèrent assez pour changer le verdict. Les
contrôles automatiques attrapent les régressions de calcul, pas celles de mise en
page — celles-là se voient sur un téléphone, et nulle part ailleurs.
