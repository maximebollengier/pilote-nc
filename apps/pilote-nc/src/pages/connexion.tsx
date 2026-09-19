import { useState, FormEvent } from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { configuration } from "@/config";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);

  if (session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  // Décidé côté serveur : en production DEV_PASSWORD est vide, seul Keycloak
  // est actif et les comptes de démonstration ne doivent jamais être servis.
  return { props: { modeDev: !!configuration().devPassword } };
};

// Comptes de démonstration (seed de dev) — mot de passe unique DEV_PASSWORD.
// Purement une commodité locale : n'a aucun sens une fois Keycloak branché.
const COMPTES_DEMO = [
  {
    profil: "ADMIN_OUTIL",
    libelle: "Admin outil",
    email: "admin.outil@example.com",
  },
  {
    profil: "PRESIDENT",
    libelle: "Président",
    email: "president@example.com",
  },
  {
    profil: "MEMBRE_GOUVERNEMENT",
    libelle: "Membre du gouvernement (Éducation)",
    email: "membre.gouvernement.education@example.com",
  },
  {
    profil: "SECRETARIAT_GENERAL",
    libelle: "Secrétariat général",
    email: "secretariat.general@example.com",
  },
  {
    profil: "DIRECTION_NC",
    libelle: "Direction NC (Enseignement)",
    email: "direction.enseignement@example.com",
  },
] as const;

const MOT_DE_PASSE_DEMO = "motdepasse-dev";

const PageConnexionKeycloak = () => {
  const router = useRouter();
  const refuse = typeof router.query.error === "string";

  return (
    <>
      <Head>
        <title>Connexion - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 py-10">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-neutral-800">
            Connexion à PILOTE Nouvelle-Calédonie
          </h1>
          {refuse ? (
            <p className="text-sm text-error">
              Connexion impossible. Si votre authentification a réussi, votre
              compte n'est peut-être pas encore autorisé sur PILOTE : contactez
              un administrateur.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => signIn("keycloak", { callbackUrl: "/" })}
            className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover"
          >
            Se connecter
          </button>
        </div>
      </main>
    </>
  );
};

const PageConnexionDev = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const soumettre = async (event: FormEvent) => {
    event.preventDefault();
    setErreur(null);
    const résultat = await signIn("credentials", {
      username: email,
      password: motDePasse,
      redirect: false,
    });
    if (résultat?.error) {
      setErreur("Identifiant ou mot de passe incorrect");
      return;
    }
    await router.push("/");
  };

  const préremplirAvec = (compteEmail: string) => {
    setErreur(null);
    setEmail(compteEmail);
    setMotDePasse(MOT_DE_PASSE_DEMO);
  };

  return (
    <>
      <Head>
        <title>Connexion - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 py-10">
        <form
          onSubmit={soumettre}
          className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm"
        >
          <h1 className="text-xl font-semibold text-neutral-800">
            Connexion à PILOTE Nouvelle-Calédonie
          </h1>
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Identifiant
            <input
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin.outil@example.com"
              className="rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Mot de passe
            <input
              type="password"
              value={motDePasse}
              onChange={(event) => setMotDePasse(event.target.value)}
              className="rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          {erreur ? <p className="text-sm text-error">{erreur}</p> : null}
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover"
          >
            Se connecter
          </button>
        </form>

        <div className="w-full max-w-sm rounded-lg border border-dashed border-neutral-300 bg-white p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Comptes de démonstration (dev)
          </p>
          <div className="flex flex-col gap-2">
            {COMPTES_DEMO.map((compte) => (
              <button
                key={compte.email}
                type="button"
                onClick={() => préremplirAvec(compte.email)}
                className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-left text-sm hover:border-primary hover:bg-neutral-50"
              >
                <span className="text-neutral-800">{compte.libelle}</span>
                <span className="text-xs text-neutral-500">
                  {compte.profil}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

const PageConnexion = ({ modeDev }: { modeDev: boolean }) =>
  modeDev ? <PageConnexionDev /> : <PageConnexionKeycloak />;

export default PageConnexion;
