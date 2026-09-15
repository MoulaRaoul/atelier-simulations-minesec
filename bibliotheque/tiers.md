# Fichiers tiers de la bibliothèque

Repris **tels quels** — ne rien y modifier. Une correction se fait en
remplaçant le fichier par une autre version amont, jamais en le retouchant :
une modification locale serait perdue au premier remplacement, et
introuvable ensuite.

**Pourquoi des copies locales.** Les simulations tournent dans des salles sans
connexion fiable. Depuis le 15/09/2026, **aucune page du dépôt ne charge quoi
que ce soit depuis Internet** (hors `archives/`, intouchable par principe), et
le build des versions sans connexion refuse toute adresse Internet qui n'est pas
justifiée dans sa liste blanche (`outils/build-hors-ligne.js`).

| Fichier | Contenu | Version | Origine | Licence | Versé le |
|---|---|---|---|---|---|
| `three.min.js` | Three.js | r128 | `cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` | MIT | 15/09/2026 |
| `three-gltf-loader.js` | chargeur glTF de Three.js | r128 | `unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js` | MIT | 04/09/2026 |

**Contrôle d'intégrité de `three.min.js`** — 603 445 octets, empreinte
identique à celle publiée par cdnjs le jour du versement :

```
sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==
```

`three-gltf-loader.js` porte en tête un bandeau de l'atelier (origine, raison
de la copie) : c'est la seule différence avec le fichier amont.

**Les deux fichiers vont ensemble.** Le chargeur r128 suppose Three.js r128.
Changer de version, c'est remplacer les deux dans le même commit, relancer
`tests/index.html`, puis le build.
