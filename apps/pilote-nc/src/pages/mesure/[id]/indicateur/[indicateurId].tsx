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

const PageDetailIndicateur = () => {
  const router = useRouter();
  const mesureId = typeof router.query.id === "string" ? router.query.id : "";
  const indicateurId =
    typeof router.query.indicateurId === "string"
      ? router.query.indicateurId
      : "";

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
  const indicateur = indicateurs?.find((candidat) => candidat.id === indicateurId);

  const peutSoumettre =
    mesure != null &&
    utilisateur?.profil === "DIRECTION_NC" &&
    utilisateur.habilitationsSecteur.includes(mesure.secteurId);
  const peutModifierHistorique = utilisateur?.profil === "SECRETARIAT_GENERAL";

  return (
    <Layout>
      <Head>
        <title>
          {indicateur ? indicateur.nom : "Indicateur"} - PILOTE
          Nouvelle-Calédonie
        </title>
      </Head>
      <Link
        href={`/mesure/${mesureId}`}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        ← Retour à la mesure
      </Link>

      {mesure ? (
        <p className="mt-2 text-xs text-neutral-500">{mesure.titre}</p>
      ) : null}

      {indicateur ? (
        <>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-neutral-800">
              {indicateur.nom}
            </h1>
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

          <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="font-medium text-neutral-800">Détail trimestriel</h2>
            <HistoriqueIndicateur
              indicateurId={indicateur.id}
              unite={indicateur.unite}
              peutModifier={peutModifierHistorique}
            />
            {peutSoumettre ? (
              <FormulaireSoumissionPva indicateurId={indicateur.id} />
            ) : null}
          </div>
        </>
      ) : (
        <p className="mt-6 text-neutral-500">
          Indicateur introuvable, ou vous n'avez pas les droits pour le
          consulter.
        </p>
      )}
    </Layout>
  );
};

export default PageDetailIndicateur;
