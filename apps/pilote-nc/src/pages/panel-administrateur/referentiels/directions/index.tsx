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

type Direction = { id: string; code: string; nom: string; secteurIds: string[] };
type Secteur = { id: string; code: string; nom: string };

const LigneDirection = ({
  direction,
  secteurs,
}: {
  direction: Direction;
  secteurs: Secteur[] | undefined;
}) => {
  const utils = trpc.useContext();
  const invalider = () => utils.directions.lister.invalidate();

  const modifier = trpc.directions.modifier.useMutation({ onSuccess: invalider });
  const supprimer = trpc.directions.supprimer.useMutation({ onSuccess: invalider });

  const [enEdition, setEnEdition] = useState(false);
  const [code, setCode] = useState(direction.code);
  const [nom, setNom] = useState(direction.nom);
  const [secteurIds, setSecteurIds] = useState<string[]>(direction.secteurIds);
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] =
    useState(false);

  const erreur = modifier.error;

  const basculerSecteur = (id: string) => {
    setSecteurIds((actuel) =>
      actuel.includes(id)
        ? actuel.filter((secteurId) => secteurId !== id)
        : [...actuel, id],
    );
  };

  const annuler = () => {
    setCode(direction.code);
    setNom(direction.nom);
    setSecteurIds(direction.secteurIds);
    setEnEdition(false);
  };

  if (enEdition) {
    return (
      <tr className="border-t border-neutral-100 align-top">
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
          <div className="flex flex-wrap gap-2">
            {secteurs?.map((secteur) => (
              <label
                key={secteur.id}
                className="flex items-center gap-1 rounded border border-neutral-300 px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={secteurIds.includes(secteur.id)}
                  onChange={() => basculerSecteur(secteur.id)}
                />
                {secteur.nom}
              </label>
            ))}
          </div>
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={modifier.isPending || secteurIds.length === 0}
              onClick={() =>
                modifier.mutate(
                  { id: direction.id, code, nom, secteurIds },
                  { onSuccess: () => setEnEdition(false) },
                )
              }
              className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary-hover disabled:opacity-50"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={annuler}
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
      <td className="px-4 py-2">{direction.code}</td>
      <td className="px-4 py-2">{direction.nom}</td>
      <td className="px-4 py-2">
        {direction.secteurIds
          .map((id) => secteurs?.find((secteur) => secteur.id === id)?.nom)
          .filter(Boolean)
          .join(", ")}
      </td>
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
        {erreur ? <p className="mt-1 text-xs text-error">{erreur.message}</p> : null}
        <ConfirmModal
          open={confirmationSuppressionOuverte}
          titre="Supprimer cette direction ?"
          message={`La direction "${direction.nom}" sera supprimée. Impossible tant qu'un utilisateur y est encore rattaché.`}
          libelleConfirmation="Supprimer"
          enCours={supprimer.isPending}
          erreur={supprimer.error?.message ?? null}
          onConfirmer={() =>
            supprimer.mutate(
              { id: direction.id },
              { onSuccess: () => setConfirmationSuppressionOuverte(false) },
            )
          }
          onAnnuler={() => setConfirmationSuppressionOuverte(false)}
        />
      </td>
    </tr>
  );
};

const PageDirections = () => {
  const utils = trpc.useContext();
  const { data: directions } = trpc.directions.lister.useQuery();
  const { data: secteurs } = trpc.secteurs.lister.useQuery();
  const creer = trpc.directions.creer.useMutation({
    onSuccess: () => utils.directions.lister.invalidate(),
  });

  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [secteurIds, setSecteurIds] = useState<string[]>([]);

  const basculerSecteur = (id: string) => {
    setSecteurIds((actuel) =>
      actuel.includes(id)
        ? actuel.filter((secteurId) => secteurId !== id)
        : [...actuel, id],
    );
  };

  const soumettre = (event: FormEvent) => {
    event.preventDefault();
    creer.mutate(
      { code, nom, secteurIds },
      {
        onSuccess: () => {
          setCode("");
          setNom("");
          setSecteurIds([]);
        },
      },
    );
  };

  return (
    <Layout>
      <Head>
        <title>Directions - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <h1 className="text-2xl font-semibold text-neutral-800">
        Directions de la Nouvelle-Calédonie
      </h1>

      <form
        onSubmit={soumettre}
        className="mt-6 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="rounded border border-neutral-300 px-3 py-2"
              placeholder="DIR-XXX"
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
        </div>
        <div>
          <p className="mb-1 text-sm text-neutral-700">Secteurs affiliés</p>
          <div className="flex flex-wrap gap-2">
            {secteurs?.map((secteur) => (
              <label
                key={secteur.id}
                className="flex items-center gap-1 rounded border border-neutral-300 px-2 py-1 text-sm"
              >
                <input
                  type="checkbox"
                  checked={secteurIds.includes(secteur.id)}
                  onChange={() => basculerSecteur(secteur.id)}
                />
                {secteur.nom}
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={creer.isPending || secteurIds.length === 0}
          className="w-fit rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
        >
          Créer
        </button>
        {creer.error ? (
          <p className="text-sm text-error">{creer.error.message}</p>
        ) : null}
      </form>

      <table className="mt-6 w-full border-collapse overflow-hidden rounded-lg border border-neutral-200 bg-white text-sm">
        <thead className="bg-neutral-100 text-left text-neutral-600">
          <tr>
            <th className="px-4 py-2">Code</th>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Secteurs</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {directions?.map((direction) => (
            <LigneDirection
              key={direction.id}
              direction={direction}
              secteurs={secteurs}
            />
          ))}
        </tbody>
      </table>
    </Layout>
  );
};

export default PageDirections;
