import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { User } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import CredentialsProvider from "next-auth/providers/credentials";
import { configuration } from "@/config";

export const keycloak = KeycloakProvider({
  clientId: configuration().keycloak.clientId,
  clientSecret: configuration().keycloak.clientSecret,
  issuer: configuration().keycloak.publicIssuer,
  authorization: { url: configuration().keycloak.authUrl },
  token: { url: configuration().keycloak.tokenUrl },
});

const credentialsProvider = CredentialsProvider({
  name: "credentials",
  credentials: {
    username: {
      label: "Identifiant",
      type: "text",
      placeholder: "admin.outil@example.com",
    },
    password: { label: "Mot de passe", type: "password" },
  },

  async authorize(credentials: Record<string, unknown>): Promise<User | null> {
    const password = credentials?.password as string | undefined;
    const username = credentials?.username as string | undefined;
    if (!username || password !== configuration().devPassword) {
      return null;
    }
    const { getContainer } = await import("@/server/dependances");
    const utilisateur = await getContainer("gestionUtilisateur")
      .resolve("recupererUnUtilisateurUseCase")
      .run(username);

    if (!utilisateur) {
      return null;
    }

    return {
      id: utilisateur.id,
      name: `${utilisateur.prenom} ${utilisateur.nom}`,
      email: utilisateur.email,
    };
  },
});

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    error: "/connexion",
  },
  providers: !!configuration().devPassword
    ? [credentialsProvider]
    : [keycloak],
  session: {
    maxAge: configuration().nextAuth.sessionMaxAge,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account != null && user != null) {
        return { ...token, user };
      }
      return token;
    },

    async session({ session, token }) {
      const { getContainer } = await import("@/server/dependances");
      const email = (token.user as User | undefined)?.email ?? session.user.email;
      const utilisateurRepository = getContainer("gestionUtilisateur").resolve(
        "utilisateurRepository",
      );
      let utilisateur = await utilisateurRepository.récupérer(email!);

      if (!utilisateur) {
        // Premier login connu du fournisseur d'identité (Agent Connect) mais
        // absent de cette table : compte minimal créé à la volée (sans nom,
        // profil `NON_DEFINI`, aucun secteur), à compléter par un ADMIN_OUTIL
        // depuis Admin > Utilisateurs. `authorize()` du provider Credentials
        // (mode DEV_PASSWORD) exige déjà l'existence du compte avant d'
        // arriver ici : cette branche ne concerne donc que Keycloak/OIDC.
        utilisateur = await utilisateurRepository.provisionnerCompteMinimal(
          email!,
        );
      }

      if (!utilisateur) {
        // Compte supprimé entre deux requêtes (provisionnerCompteMinimal ne
        // réactive pas un compte `deletedAt`) : la session est invalidée,
        // proxy.ts redirige alors vers /connexion.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return null as any;
      }

      session.user = {
        ...session.user,
        id: utilisateur.id,
        email: utilisateur.email,
      };
      session.profil = utilisateur.profil;
      session.transparenceGlobale = utilisateur.transparenceGlobale;
      session.habilitationsSecteur = utilisateur.habilitationsSecteur;

      return session;
    },
  },
};

export const { auth, handlers } = NextAuth(authConfig);
