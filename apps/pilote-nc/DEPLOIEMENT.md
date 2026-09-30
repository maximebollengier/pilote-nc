# Déploiement de pilote-nc sur Scaleway (Paris, `fr-par`)

Chaque push sur `main` touchant `apps/pilote-nc/**` ou `pnpm-lock.yaml` lance
`.github/workflows/deploy-pilote-nc-scaleway.yml` :

1. **Tests** : génération Prisma, `tsc --noEmit`, tests unitaires.
2. **Build** des images `pilote-nc` et `pilote-nc-migrate`, poussées dans le
   Container Registry (étiquettes `<sha du commit>` et `latest`).
3. **Migrations** Prisma (voir §4).
4. **Déploiement** : `scw container container update image=…`, puis attente de
   l'état `ready` (échec du workflow si le conteneur ne démarre pas).

> **Fournisseur d'identité (depuis le 28/09/2026)** : l'application
> s'authentifie sur **Agent Connect**, le Keycloak de la DSI
> (`https://connect.gouv.nc/v3/realms/agent-connect`). Voir §5 et §6.
>
> **Le Keycloak auto-hébergé (`auth.maxnc.fr`) a été entièrement supprimé le
> 01/10/2026** (conteneur, domaine, DNS, image registry et base `keycloak`) :
> il ne servait plus l'authentification depuis la bascule sur Agent Connect.
> Pour le recréer, repartir de l'historique git avant cette date
> (`apps/pilote-nc/keycloak/`, `.github/workflows/deploy-keycloak-scaleway.yml`).

## 1. Architecture en place

| Élément | Détail |
|---|---|
| Application | `https://pilote.maxnc.fr` — Serverless Container `pilote-nc`, port 3000, 1 Go, 560 mvCPU, `min-scale=0` (démarrage à froid possible), `max-scale=2` |
| Base de données | Managed PostgreSQL 16, instance `pilote-nc`, type `db-dev-s`, sans haute disponibilité. Base `pilote_nc` (utilisateur `pilote`) |
| Réseau | Réseau privé `pilote-nc-pn` : la base (`172.16.4.2:5432`) et le conteneur y sont rattachés. **Le point d'accès public de la base est fermé** (aucune règle ACL en régime normal) |
| Registry | Container Registry privé `pilote-nc` : images `pilote-nc`, `pilote-nc-migrate` |
| DNS | Zone `maxnc.fr` chez Scaleway ; CNAME `pilote` vers l'adresse `…functions.fnc.fr-par.scw.cloud` du conteneur. Certificat HTTPS émis par Scaleway |

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
| `KEYCLOAK_CLIENT_SECRET` | secret du client `pilote-nc-prod` **côté Agent Connect (DSI)**, pas du Keycloak auto-hébergé | oui |
| `BASE_URL`, `NEXTAUTH_URL` | `https://pilote.maxnc.fr` | non |
| `KEYCLOAK_CLIENT_ID` | `pilote-nc-prod` | non |
| `KEYCLOAK_ISSUER`, `KEYCLOAK_PUBLIC_ISSUER` | `https://connect.gouv.nc/v3/realms/agent-connect` | non |
| `LOG_LEVEL` | `info` | non |
| `DEV_PASSWORD` | **ne jamais définir** : sinon Agent Connect est désactivé et les comptes de démonstration réapparaissent | — |

Les secrets ne sont pas dans le dépôt : les conserver dans un gestionnaire de
mots de passe.

## 3. Secrets et variables GitHub

Secrets : `SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, `SCW_DEFAULT_PROJECT_ID`,
`SCW_DEFAULT_ORGANIZATION_ID`, `DATABASE_URL_MIGRATION` (URL de la base sur son
point d'accès **public**, `sslmode=require`, utilisée uniquement par le CI).

Variables : `SCW_REGISTRY_NAMESPACE`, `SCW_DB_INSTANCE_ID`, `SCW_CONTAINER_ID`.

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

- L'application n'accepte que l'authentification externe en production : la
  page `/connexion` n'affiche qu'un bouton « Se connecter ». Les comptes de
  démonstration ne sont servis que si `DEV_PASSWORD` est défini (développement
  local).
- Depuis le 28/09/2026, cette authentification externe est **Agent Connect**,
  le Keycloak de la DSI (§6).
- Un utilisateur doit exister **des deux côtés** avec le **même email** : dans
  Agent Connect (côté DSI, hors de notre contrôle) et dans la table
  `utilisateur`. Un compte Agent Connect absent de la table `utilisateur` est
  refusé ; on ne crée plus aucun compte utilisateur nous-mêmes dans un
  Keycloak — la création/désactivation des comptes côté identité est à la
  charge de la DSI.
- **Premier administrateur** : s'assurer que la personne a bien un compte
  Agent Connect (DSI), puis créer sa ligne dans `utilisateur` :

  ```sql
  INSERT INTO utilisateur (email, nom, prenom, profil, updated_at)
  VALUES ('prenom.nom@exemple.nc', 'Nom', 'Prénom', 'ADMIN_OUTIL', now())
  ON CONFLICT (email) DO UPDATE
    SET profil = 'ADMIN_OUTIL', deleted_at = NULL, updated_at = now();
  ```

  `updated_at` n'a pas de valeur par défaut en base : il doit être fourni.
- Les autres comptes : Admin > Utilisateurs dans l'application uniquement (plus
  de création de compte Keycloak en parallèle).

## 6. Identité (Agent Connect)

### Agent Connect (DSI) — fournisseur en production

- Réalm : `https://connect.gouv.nc/v3/realms/agent-connect` (suit le standard
  Keycloak : `/protocol/openid-connect/{auth,token,userinfo,logout,certs}`).
  Client `pilote-nc-prod`, confidentiel (authentification par secret),
  *Standard Flow* (Authorization Code) uniquement.
- Redirect URI enregistrée côté DSI : `https://pilote.maxnc.fr/api/auth/callback/keycloak`.
  Post-logout redirect URI : `https://pilote.maxnc.fr/*`.
- **La déconnexion applicative ne ferme pas la session Agent Connect** :
  `signOut()` (`[...nextauth].tsx`) n'appelle pas leur `end_session_endpoint`,
  seule la session de pilote-nc est fermée. Un utilisateur qui se déconnecte
  puis reclique sur « Se connecter » sera probablement reconnecté sans
  ressaisir d'identifiants (SSO actif côté DSI). À corriger si ce n'est pas le
  comportement voulu.
- Si l'adresse de l'application change, ou pour toute modification du client
  `pilote-nc-prod` (redirect URI, secret, scopes), il faut passer par la
  DSI : nous ne gérons pas leur realm.
- Le `client_secret` est dans le gestionnaire de mots de passe local, pas dans
  le dépôt.

## 7. Changer de domaine

1. Créer le CNAME dans la zone DNS, vers l'adresse du conteneur.
2. `scw container domain create hostname=<nom> container-id=<ID>`, puis
   attendre l'état `ready` (émission du certificat).
3. Mettre à jour les variables (§2) et demander à la DSI de corriger la
   redirect URI du client `pilote-nc-prod` sur Agent Connect (§6).

## Points à connaître

- **Sauvegardes PostgreSQL** : à activer côté base managée.
- **Haute disponibilité** : non activée (instance unique).
- **Avertissements GitHub** (Node 20, `ubuntu-latest`) sur les actions
  utilisées : sans effet pour l'instant.
- **Tests e2e** : non lancés dans le workflow de déploiement.
