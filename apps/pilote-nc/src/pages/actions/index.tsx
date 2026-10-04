import Head from "next/head";
import { useState, FormEvent } from "react";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { trpc } from "@/client/utils/trpc";
import { Layout } from "@/client/components/Layout";
import { TableauActions } from "@/client/components/actions/TableauActions";
import { LIBELLES_TYPE_ACTION, TypeAction } from "@/server/actions/domain/TypeAction";
import { Modal } from "@/client/components/Modal";
import { VueCalendrierActions } from "@/client/components/actions/VueCalendrierActions";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);
  if (!session) {
    return { redirect: { destination: "/connexion", permanent: false } };
  }
  return { props: {} };
};

const PROFILS_GESTIONNAIRES = [
  "ADMIN_OUTIL",
  "DIRECTION_NC",
  "SECRETARIAT_GENERAL",
] as const;

// Mesure catch-all créée par le seed pour les actions qui ne se rattachent à
// aucune des 5 priorités gouvernementales — présélectionnée par défaut dans
// le formulaire pour éviter de forcer un rattachement artificiel.
const CODE_MESURE_NON_PRIORITAIRE = "MES-000";

const VUES = [
  { id: "tableau", libelle: "Tableau" },
  { id: "calendrier", libelle: "Calendrier" },
] as const;
type Vue = (typeof VUES)[number]["id"];

const FormulaireNouvelleAction = ({
  mesures,
  onCreated,
}: {
  mesures: { id: string; code: string; titre: string }[];
  onCreated: () => void;
}) => {
  const utils = trpc.useContext();
  const creer = trpc.actions.creer.useMutation({
    onSuccess: () => utils.actions.lister.invalidate(),
  });
  const mesureNonPrioritaire = mesures.find(
    (mesure) => mesure.code === CODE_MESURE_NON_PRIORITAIRE,
  );
  const [mesureId, setMesureId] = useState(mesureNonPrioritaire?.id ?? "");
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<TypeAction>("JURIDIQUE");
  const [datePrevisionnelleDebut, setDatePrevisionnelleDebut] = useState("");
  const [datePrevisionnelleFin, setDatePrevisionnelleFin] = useState("");

  const soumettre = (event: FormEvent) => {
    event.preventDefault();
    if (!mesureId) return;
    creer.mutate(
      {
        mesureId,
        titre,
        type,
        dateEcheance: null,
        datePrevisionnelleDebut: datePrevisionnelleDebut || null,
        datePrevisionnelleFin: datePrevisionnelleFin || null,
      },
      {
        onSuccess: () => {
          setTitre("");
          setDatePrevisionnelleDebut("");
          setDatePrevisionnelleFin("");
          onCreated();
        },
      },
    );
  };

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Objectif
        <select
          value={mesureId}
          onChange={(event) => setMesureId(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        >
          <option value="">— choisir —</option>
          {mesures.map((mesure) => (
            <option key={mesure.id} value={mesure.id}>
              {mesure.titre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Titre de l'action
        <input
          value={titre}
          onChange={(event) => setTitre(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Type
        <select
          value={type}
          onChange={(event) => setType(event.target.value as TypeAction)}
          className="rounded border border-neutral-300 px-3 py-2"
        >
          {Object.entries(LIBELLES_TYPE_ACTION).map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Date de début prévisionnelle
        <input
          type="date"
          value={datePrevisionnelleDebut}
          onChange={(event) => setDatePrevisionnelleDebut(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Date de fin prévisionnelle
        <input
          type="date"
          value={datePrevisionnelleFin}
          onChange={(event) => setDatePrevisionnelleFin(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={creer.isPending || !mesureId || !titre}
        className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
      >
        Ajouter l'action
      </button>
      {creer.error ? <p className="text-sm text-error">{creer.error.message}</p> : null}
    </form>
  );
};

const PageActions = () => {
  const { data: actions, isLoading } = trpc.actions.lister.useQuery();
  const { data: mesures } = trpc.mesures.lister.useQuery();
  const { data: utilisateur } =
    trpc.profilUtilisateur.getUtilisateurConnecte.useQuery();

  const peutGerer =
    !!utilisateur &&
    (PROFILS_GESTIONNAIRES as readonly string[]).includes(utilisateur.profil);

  const [modaleCreationOuverte, setModaleCreationOuverte] = useState(false);
  const [vue, setVue] = useState<Vue>("tableau");
  return (
    <Layout>
      <Head>
        <title>Actions - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-800">Actions</h1>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
            {VUES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setVue(option.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  vue === option.id
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {option.libelle}
              </button>
            ))}
          </div>
          {peutGerer ? (
            <button
              type="button"
              onClick={() => setModaleCreationOuverte(true)}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Ajouter une action
            </button>
          ) : null}
        </div>
      </div>

      {peutGerer && mesures ? (
        <Modal
          open={modaleCreationOuverte}
          titre="Ajouter une action"
          onFermer={() => setModaleCreationOuverte(false)}
        >
          <FormulaireNouvelleAction
            mesures={mesures}
            onCreated={() => setModaleCreationOuverte(false)}
          />
        </Modal>
      ) : null}

      {isLoading ? <p className="mt-6 text-neutral-500">Chargement…</p> : null}

      {actions && actions.length === 0 ? (
        <p className="mt-6 text-neutral-500">
          Aucune action visible pour votre profil pour le moment.
        </p>
      ) : null}

      {actions && actions.length > 0 && vue === "tableau" ? (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
          <TableauActions
            actions={actions}
            peutGerer={peutGerer}
            peutSupprimer={peutGerer}
            afficherObjectif
            triInitial={{ colonne: "titre", croissant: true }}
          />
        </div>
      ) : null}

      {actions && actions.length > 0 && vue === "calendrier" ? (
        <VueCalendrierActions actions={actions} />
      ) : null}
    </Layout>
  );
};

export default PageActions;
