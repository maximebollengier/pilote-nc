import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { trpc } from "@/client/utils/trpc";
import { Layout } from "@/client/components/Layout";
import { HistoriqueIndicateur } from "@/client/components/mesures/HistoriqueIndicateur";
import { FormulaireSoumissionPva } from "@/client/components/mesures/FormulaireSoumissionPva";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);
  if (!session) {
    return { redirect: { destination: "/connexion", permanent: false } };
  }
  return { props: {} };
};

const PageIndicateursMesure = () => {
  const router = useRouter();
  const mesureId = typeof router.query.id === "string" ? router.query.id : "";

  const { data: utilisateur } =
    trpc.profilUtilisateur.getUtilisateurConnecte.useQuery();
  const { data: mesure } = trpc.mesures.recuperer.useQuery(
    { id: mesureId },
    { enabled: mesureId !== "" },
  );
  const { data: indicateurs } = trpc.indicateursImpact.listerParMesure.useQuery(
    { mesureId },
    { enabled: mesureId !== "" },
  );

  const peutSoumettre =
    mesure != null &&
    utilisateur?.profil === "DIRECTION_NC" &&
    utilisateur.habilitationsSecteur.includes(mesure.secteurId);
  const peutModifierHistorique = utilisateur?.profil === "SECRETARIAT_GENERAL";

  return (
    <Layout>
      <Head>
        <title>Indicateurs d'impact - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <Link
        href={`/mesure/${mesureId}`}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        ← Retour à la mesure
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-neutral-800">
        Suivi trimestriel des indicateurs
        {mesure ? ` — ${mesure.titre}` : ""}
      </h1>

      <div className="mt-6 grid gap-4">
        {indicateurs?.map((indicateur) => (
          <div
            key={indicateur.id}
            className="rounded-lg border border-neutral-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-neutral-800">
                {indicateur.nom}
              </h2>
              <span className="text-sm text-neutral-500">
                Cible : {indicateur.valeurCible}
                {indicateur.unite ?? ""}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-600">
              Valeur actuelle : {indicateur.valeurActuelle ?? "non renseignée"}
              {" — "}
              Taux de réalisation :{" "}
              {indicateur.tauxRealisation === null
                ? "—"
                : `${Math.round(indicateur.tauxRealisation)}%`}
            </p>
            <HistoriqueIndicateur
              indicateurId={indicateur.id}
              unite={indicateur.unite}
              peutModifier={peutModifierHistorique}
            />
            {peutSoumettre ? (
              <FormulaireSoumissionPva indicateurId={indicateur.id} />
            ) : null}
          </div>
        ))}
        {indicateurs && indicateurs.length === 0 ? (
          <p className="text-neutral-500">
            Aucun indicateur d'impact défini pour cette mesure.
          </p>
        ) : null}
      </div>
    </Layout>
  );
};

export default PageIndicateursMesure;
