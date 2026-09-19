import Head from "next/head";
import { useState } from "react";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { trpc } from "@/client/utils/trpc";
import { Layout } from "@/client/components/Layout";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);
  if (!session) {
    return { redirect: { destination: "/connexion", permanent: false } };
  }
  if (session.profil !== "SECRETARIAT_GENERAL") {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
};

type Decision = "valider" | "modifier" | "refuser";

const LignePva = ({
  pva,
}: {
  pva: {
    id: string;
    indicateurNom: string;
    mesureTitre: string;
    annee: number;
    trimestre: number;
    valeurProposee: number;
    dateSoumission: Date;
  };
}) => {
  const utils = trpc.useContext();
  const invalider = () =>
    utils.propositionValeurAvancement.listerEnAttente.invalidate();

  const valider = trpc.propositionValeurAvancement.valider.useMutation({
    onSuccess: invalider,
  });
  const validerAvecModification =
    trpc.propositionValeurAvancement.validerAvecModification.useMutation({
      onSuccess: invalider,
    });
  const refuser = trpc.propositionValeurAvancement.refuser.useMutation({
    onSuccess: invalider,
  });

  const [decision, setDecision] = useState<Decision | null>(null);
  const [valeurCorrigee, setValeurCorrigee] = useState(
    String(pva.valeurProposee),
  );
  const [commentaire, setCommentaire] = useState("");

  const enCours =
    valider.isPending || validerAvecModification.isPending || refuser.isPending;

  const confirmer = () => {
    if (decision === "valider") {
      valider.mutate({ pvaId: pva.id, commentaireSg: commentaire || null });
    } else if (decision === "modifier") {
      validerAvecModification.mutate({
        pvaId: pva.id,
        valeurCorrigee: Number(valeurCorrigee),
        commentaireSg: commentaire || null,
      });
    } else if (decision === "refuser") {
      refuser.mutate({ pvaId: pva.id, motifRefus: commentaire });
    }
  };

  const erreur = valider.error ?? validerAvecModification.error ?? refuser.error;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-neutral-800">
            {pva.indicateurNom}
          </h2>
          <p className="text-xs text-neutral-500">{pva.mesureTitre}</p>
        </div>
        <span className="text-sm text-neutral-600">
          T{pva.trimestre} {pva.annee}
        </span>
      </div>
      <p className="mt-2 text-sm text-neutral-700">
        Valeur proposée : <strong>{pva.valeurProposee}</strong>
      </p>

      {decision === null ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setDecision("valider")}
            className="rounded bg-success px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            Valider
          </button>
          <button
            type="button"
            onClick={() => setDecision("modifier")}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
          >
            Valider avec modification
          </button>
          <button
            type="button"
            onClick={() => setDecision("refuser")}
            className="rounded bg-error px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            Refuser
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2 rounded border border-neutral-200 p-3">
          {decision === "modifier" ? (
            <label className="flex flex-col gap-1 text-sm text-neutral-700">
              Valeur corrigée
              <input
                type="number"
                value={valeurCorrigee}
                onChange={(event) => setValeurCorrigee(event.target.value)}
                className="w-32 rounded border border-neutral-300 px-2 py-1"
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            {decision === "refuser"
              ? "Motif du refus (obligatoire)"
              : "Commentaire (facultatif)"}
            <textarea
              value={commentaire}
              onChange={(event) => setCommentaire(event.target.value)}
              className="rounded border border-neutral-300 px-2 py-1"
              rows={2}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmer}
              disabled={
                enCours || (decision === "refuser" && commentaire.trim() === "")
              }
              className="rounded bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setDecision(null)}
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              Annuler
            </button>
          </div>
          {erreur ? <p className="text-sm text-error">{erreur.message}</p> : null}
        </div>
      )}
    </div>
  );
};

const PagePva = () => {
  const { data: pvas, isLoading } =
    trpc.propositionValeurAvancement.listerEnAttente.useQuery();

  return (
    <Layout>
      <Head>
        <title>Validations en attente - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <h1 className="text-2xl font-semibold text-neutral-800">
        Propositions en attente de validation
      </h1>

      {isLoading ? <p className="mt-6 text-neutral-500">Chargement…</p> : null}
      {pvas && pvas.length === 0 ? (
        <p className="mt-6 text-neutral-500">Aucune proposition en attente.</p>
      ) : null}

      <div className="mt-6 grid gap-4">
        {pvas?.map((pva) => (
          <LignePva key={pva.id} pva={pva} />
        ))}
      </div>
    </Layout>
  );
};

export default PagePva;
