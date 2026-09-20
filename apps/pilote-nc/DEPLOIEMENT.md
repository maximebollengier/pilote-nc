# Déploiement de pilote-nc sur Scaleway (Paris, `fr-par`)

Chaque push sur `main` touchant `apps/pilote-nc/**` ou `pnpm-lock.yaml` lance
`.github/workflows/deploy-pilote-nc-scaleway.yml` :

1. **Tests** : génération Prisma, `tsc --noEmit`, tests unitaires.
2. **Build** des images `pilote-nc` et `pilote-nc-migrate`, poussées dans le
   Container Registry (étiquettes `<sha du commit>` et `latest`).
3. **Migrations** Prisma (voir §4).
4. **Déploiement** : `scw container container update image=…`, puis attente de
   l'état `ready` (échec du workflow si le conteneur ne démarre pas).

`deploy-keycloak-scaleway.yml` fait de même pour Keycloak, uniquement si
`apps/pilote-nc/keycloak/` change.

## 1. Architecture en place

| Élément | Détail |
|---|---|
| Application | `https://pilote.maxnc.fr` — Serverless Container `pilote-nc`, port 3000, 1 Go, 560 mvCPU, `min-scale=0` (démarrage à froid possible), `max-scale=2` |
| Keycloak | `https://auth.maxnc.fr` — Serverless Container `keycloak`, port 8080, 2 Go, 1120 mvCPU, `min-scale=1`, `max-scale=1`, realm `pilote` |
| Base de données | Managed PostgreSQL 16, instance `pilote-nc`, type `db-dev-s`, sans haute disponibilité. Bases `pilote_nc` (utilisateur `pilote`) et `keycloak` (utilisateur `keycloak`) |
| Réseau | Réseau privé `pilote-nc-pn` : la base (`172.16.4.2:5432`) et les deux conteneurs y sont rattachés. **Le point d'accès public de la base est fermé** (aucune règle ACL en régime normal) |
| Registry | Container Registry privé `pilote-nc` : images `pilote-nc`, `pilote-nc-migrate`, `keycloak-pilote` |
| DNS | Zone `maxnc.fr` chez Scaleway ; CNAME `pilote` et `auth` vers les adresses `…functions.fnc.fr-par.scw.cloud` des conteneurs. Certificats HTTPS émis par Scaleway |

## 2. Variables d'environnement des conteneurs

> **Attention** : `scw container container update` **remplace** la liste
> `environment-variables` (elle n'est pas fusionnée). Toujours redonner la liste
> complète des variables non secrètes, sinon les autres disparaissent. Les
> variables secrètes (`secret-environment-variables`) sont conservées à part.

**Conteneur `pilote-nc`**

| Variable | Valeur | Secret |
|---|---|---|
| `DATABASE_URL` | `postgresql://pilote:…@172.16.4.2:5432/pilote_nc?sslmode=require` | oui |
| `NEXTAUTH_SECRET` | aléatoire (`openssl rand -base64 32`) | oui |
| `KEYCLOAK_CLIENT_SECRET` | identique à celui du client Keycloak | oui |
| `BASE_URL`, `NEXTAUTH_URL` | `https://pilote.maxnc.fr` | non |
| `KEYCLOAK_CLIENT_ID` | `pilote-nc` | non |
| `KEYCLOAK_ISSUER`, `KEYCLOAK_PUBLIC_ISSUER` | `https://auth.maxnc.fr/realms/pilote` | non |
| `LOG_LEVEL` | `info` | non |
| `DEV_PASSWORD` | **ne jamais définir** : sinon Keycloak est désactivé et les comptes de démonstration réapparaissent | — |

**Conteneur `keycloak`**

| Variable | Valeur | Secret |
|---|---|---|
| `KC_DB_PASSWORD` | mot de passe de l'utilisateur `keycloak` | oui |
| `KC_BOOTSTRAP_ADMIN_USERNAME`, `KC_BOOTSTRAP_ADMIN_PASSWORD` | compte admin initial de la console | oui |
| `KEYCLOAK_CLIENT_SECRET` | secret du client `pilote-nc` | oui |
| `KC_DB_URL` | `jdbc:postgresql://172.16.4.2:5432/keycloak` | non |
| `KC_DB_USERNAME` | `keycloak` | non |
| `KC_HOSTNAME` | `https://auth.maxnc.fr` | non |
| `APP_URL` | `https://pilote.maxnc.fr` | non |

Les secrets ne sont pas dans le dépôt : les conserver dans un gestionnaire de
mots de passe.

## 3. Secrets et variables GitHub

Secrets : `SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, `SCW_DEFAULT_PROJECT_ID`,
`SCW_DEFAULT_ORGANIZATION_ID`, `DATABASE_URL_MIGRATION` (URL de la base sur son
point d'accès **public**, `sslmode=require`, utilisée uniquement par le CI).

Variables : `SCW_REGISTRY_NAMESPACE`, `SCW_DB_INSTANCE_ID`, `SCW_CONTAINER_ID`,
`SCW_KEYCLOAK_CONTAINER_ID`.

La clé d'API IAM du CI a besoin des droits sur le Container Registry, les
Serverless Containers et les bases managées (règles ACL).

## 4. Migrations

Elles s'exécutent dans GitHub Actions, avant le déploiement. La base étant
fermée à Internet, le runner :

1. ajoute sa propre IP aux règles ACL de la base (`scw rdb acl add … --wait`),
2. lance l'image `pilote-nc-migrate` (`prisma migrate deploy`),
3. retire la règle, **même en cas d'échec**.

Un Serverless Job n'est pas utilisable ici : il ne peut pas se rattacher à un
réseau privé. Pour se connecter soi-même à la base (diagnostic), ajouter de la
même façon son IP en règle temporaire, puis la retirer :

```bash
scw rdb acl add "$(curl -s https://api.ipify.org)/32" instance-id=<ID> --wait
# … psql sur le point d'accès public …
scw rdb acl delete "<IP>/32" instance-id=<ID> --wait
```

### Migrations appliquées (repères)

Le dossier `src/database/prisma/migrations/` fait foi. Migration à connaître :

- `20260920013343_ajoute_synchronisation_openproject_action` : prépare la
  synchronisation de l'avancement des actions depuis OpenProject. Ajoute à la
  table `action` la source d'avancement (`MANUELLE` par défaut, ou `OPENPROJECT`),
  le rattachement au projet / lot de travail OpenProject et l'état de la dernière
  synchronisation. Migration additive (colonnes avec valeur par défaut) : les
  actions existantes restent en saisie manuelle. Rien n'est encore lu ni écrit
  par l'application : la synchronisation reste à développer.

## 5. Connexion et comptes

- L'application n'accepte que Keycloak en production : la page `/connexion`
  n'affiche qu'un bouton « Se connecter ». Les comptes de démonstration ne sont
  servis que si `DEV_PASSWORD` est défini (développement local).
- Un utilisateur doit exister **des deux côtés** avec le **même email** : dans
  Keycloak (realm `pilote`) et dans la table `utilisateur`. Un compte Keycloak
  absent de la table est refusé.
- **Premier administrateur** : le créer dans Keycloak (console `auth.maxnc.fr`,
  ou API d'administration, avec un mot de passe provisoire à changer), puis :

  ```sql
  INSERT INTO utilisateur (email, nom, prenom, profil, updated_at)
  VALUES ('prenom.nom@exemple.nc', 'Nom', 'Prénom', 'ADMIN_OUTIL', now())
  ON CONFLICT (email) DO UPDATE
    SET profil = 'ADMIN_OUTIL', deleted_at = NULL, updated_at = now();
  ```

  `updated_at` n'a pas de valeur par défaut en base : il doit être fourni.
- Les autres comptes : Admin > Utilisateurs dans l'application, **et** création
  du compte dans Keycloak.

## 6. Keycloak

- L'image (`apps/pilote-nc/keycloak/`) importe `realm-pilote.json` **uniquement
  au premier démarrage**, avec les variables `APP_URL` et
  `KEYCLOAK_CLIENT_SECRET`. Ensuite le realm se modifie dans la console : changer
  le fichier ne suffit pas.
- Si l'adresse de l'application change, corriger le client `pilote-nc` dans la
  console : *Valid redirect URIs* = `https://<appli>/api/auth/callback/keycloak`,
  *Web origins* = `https://<appli>`, et l'URL de redirection après déconnexion.
  Mettre aussi à jour `KC_HOSTNAME`, `APP_URL` et les variables `KEYCLOAK_*` de
  l'application (en redonnant la liste complète, voir l'avertissement du §2).
- `min-scale=1` évite le démarrage à froid de Keycloak mais coûte en continu.

## 7. Changer de domaine

1. Créer les CNAME dans la zone DNS, vers les adresses des conteneurs.
2. `scw container domain create hostname=<nom> container-id=<ID>` pour chaque
   conteneur, puis attendre l'état `ready` (émission du certificat).
3. Mettre à jour les variables (§2) et le client Keycloak (§6).

## Points à connaître

- **Sauvegardes PostgreSQL** : à activer côté base managée.
- **Haute disponibilité** : non activée (instance unique).
- **Interface Keycloak** en anglais par défaut ; le realm peut être passé en
  français dans la console.
- **Avertissements GitHub** (Node 20, `ubuntu-latest`) sur les actions
  utilisées : sans effet pour l'instant.
- **Tests e2e** : non lancés dans le workflow de déploiement.
