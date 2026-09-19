import Head from "next/head";
import { useState, FormEvent } from "react";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { trpc } from "@/client/utils/trpc";
import { Layout } from "@/client/components/Layout";
import { ConfirmModal } from "@/client/components/ConfirmModal";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);
  if (!session) {
    return { redirect: { destination: "/connexion", permanent: false } };
  }
  if (session.profil !== "ADMIN_OUTIL") {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
};

type Secteur = {
  id: string;
  code: string;
  nom: string;
  accordGouvernance: boolean;
};

const LigneSecteur = ({ secteur }: { secteur: Secteur }) => {
  const utils = trpc.useContext();
  const invalider = () => utils.secteurs.lister.invalidate();

  const modifier = trpc.secteurs.modifier.useMutation({ onSuccess: invalider });
  const supprimer = trpc.secteurs.supprimer.useMutation({ onSuccess: invalider });

  const [enEdition, setEnEdition] = useState(false);
  const [code, setCode] = useState(secteur.code);
  const [nom, setNom] = useState(secteur.nom);
  const [accordGouvernance, setAccordGouvernance] = useState(
    secteur.accordGouvernance,
  );
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] =
    useState(false);

  const erreur = modifier.error ?? supprimer.error;

  if (enEdition) {
    return (
      <tr className="border-t border-neutral-100">
        <td className="px-4 py-2">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1"
          />
        </td>
        <td className="px-4 py-2">
          <input
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1"
          />
        </td>
        <td className="px-4 py-2">
          <select
            value={accordGouvernance ? "oui" : "non"}
            onChange={(event) => setAccordGouvernance(event.target.value === "oui")}
            className="w-full rounded border border-neutral-300 px-2 py-1"
          >
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={modifier.isPending}
              onClick={() =>
                modifier.mutate(
                  {
                    id: secteur.id,
                    code,
                    nom,
                    accordGouvernance,
                    membreGouvernementId: null,
                  },
                  { onSuccess: () => setEnEdition(false) },
                )
              }
              className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary-hover"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => {
                setCode(secteur.code);
                setNom(secteur.nom);
                setAccordGouvernance(secteur.accordGouvernance);
                setEnEdition(false);
              }}
              className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
            >
              Annuler
            </button>
          </div>
          {erreur ? <p className="mt-1 text-xs text-error">{erreur.message}</p> : null}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-neutral-100">
      <td className="px-4 py-2">{secteur.code}</td>
      <td className="px-4 py-2">{secteur.nom}</td>
      <td className="px-4 py-2">{secteur.accordGouvernance ? "Oui" : "Non"}</td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEnEdition(true)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
          >
            Modifier
          </button>
          <button
            type="button"
            disabled={supprimer.isPending}
            onClick={() => setConfirmationSuppressionOuverte(true)}
            className="rounded border border-error px-2 py-1 text-xs text-error hover:bg-error/10"
          >
            Supprimer
          </button>
        </div>
        {modifier.error ? (
          <p className="mt-1 text-xs text-error">{modifier.error.message}</p>
        ) : null}
        <ConfirmModal
          open={confirmationSuppressionOuverte}
          titre="Supprimer ce secteur ?"
          message={`Le secteur "${secteur.nom}" sera supprimé. Impossible tant qu'une mesure y est encore rattachée.`}
          libelleConfirmation="Supprimer"
          enCours={supprimer.isPending}
          erreur={supprimer.error?.message ?? null}
          onConfirmer={() =>
            supprimer.mutate(
              { id: secteur.id },
              { onSuccess: () => setConfirmationSuppressionOuverte(false) },
            )
          }
          onAnnuler={() => setConfirmationSuppressionOuverte(false)}
        />
      </td>
    </tr>
  );
};

const PageSecteurs = () => {
  const utils = trpc.useContext();
  const { data: secteurs } = trpc.secteurs.lister.useQuery();
  const creer = trpc.secteurs.creer.useMutation({
    onSuccess: () => utils.secteurs.lister.invalidate(),
  });

  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [accordGouvernance, setAccordGouvernance] = useState(false);

  const soumettre = (event: FormEvent) => {
    event.preventDefault();
    creer.mutate(
      { code, nom, accordGouvernance, membreGouvernementId: null },
      {
        onSuccess: () => {
          setCode("");
          setNom("");
          setAccordGouvernance(false);
        },
      },
    );
  };

  return (
    <Layout>
      <Head>
        <title>Secteurs - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <h1 className="text-2xl font-semibold text-neutral-800">Secteurs</h1>

      <form
        onSubmit={soumettre}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Code
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="SECT-XXX"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Nom
          <input
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Accord de gouvernance
          <select
            value={accordGouvernance ? "oui" : "non"}
            onChange={(event) => setAccordGouvernance(event.target.value === "oui")}
            className="rounded border border-neutral-300 px-3 py-2"
          >
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={creer.isPending}
          className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
        >
          Créer
        </button>
        {creer.error ? (
          <p className="w-full text-sm text-error">{creer.error.message}</p>
        ) : null}
      </form>

      <table className="mt-6 w-full border-collapse overflow-hidden rounded-lg border border-neutral-200 bg-white text-sm">
        <thead className="bg-neutral-100 text-left text-neutral-600">
          <tr>
            <th className="px-4 py-2">Code</th>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Accord de gouvernance</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {secteurs?.map((secteur) => (
            <LigneSecteur key={secteur.id} secteur={secteur} />
          ))}
        </tbody>
      </table>
    </Layout>
  );
};

export default PageSecteurs;
