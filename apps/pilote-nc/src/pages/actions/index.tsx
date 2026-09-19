import Head from "next/head";
import Link from "next/link";
import { useMemo, useState, FormEvent } from "react";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { trpc } from "@/client/utils/trpc";
import { Layout } from "@/client/components/Layout";
import { BarreAvancement } from "@/client/components/BarreAvancement";
import { BadgeBloquee } from "@/client/components/BadgeBloquee";
import { LIBELLES_TYPE_ACTION, TypeAction } from "@/server/actions/domain/TypeAction";
import { MesurePrioritaire } from "@/server/mesures/domain/MesurePrioritaire";
import { Modal } from "@/client/components/Modal";
import { ConfirmModal } from "@/client/components/ConfirmModal";
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

type ActionAvecMesure = {
  id: string;
  mesureId: string;
  mesureTitre: string;
  mesurePrioritaire: MesurePrioritaire;
  titre: string;
  type: TypeAction;
  tauxAvancement: number;
  datePrevisionnelleDebut: Date | null;
  datePrevisionnelleFin: Date | null;
  bloquee: boolean;
  raisonBlocage: string | null;
  precisionArbitrage: string | null;
};

// Mesure catch-all créée par le seed pour les actions qui ne se rattachent à
// aucune des 5 priorités gouvernementales — présélectionnée par défaut dans
// le formulaire pour éviter de forcer un rattachement artificiel.
const CODE_MESURE_NON_PRIORITAIRE = "MES-000";

function versValeurInput(date: Date | null): string {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

type Colonne =
  | "titre"
  | "mesureTitre"
  | "type"
  | "datePrevisionnelleDebut"
  | "datePrevisionnelleFin"
  | "tauxAvancement"
  | "bloquee";

const COLONNES: { cle: Colonne; libelle: string }[] = [
  { cle: "titre", libelle: "Action" },
  { cle: "mesureTitre", libelle: "Mesure" },
  { cle: "type", libelle: "Type" },
  { cle: "datePrevisionnelleDebut", libelle: "Début prévisionnel" },
  { cle: "datePrevisionnelleFin", libelle: "Fin prévisionnelle" },
  { cle: "tauxAvancement", libelle: "Avancement" },
  { cle: "bloquee", libelle: "Bloquée" },
];

const VUES = [
  { id: "tableau", libelle: "Tableau" },
  { id: "calendrier", libelle: "Calendrier" },
] as const;
type Vue = (typeof VUES)[number]["id"];

function comparerDatesNullables(a: Date | null, b: Date | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.getTime() - b.getTime();
}

function comparerActions(
  a: ActionAvecMesure,
  b: ActionAvecMesure,
  colonne: Colonne,
  croissant: boolean,
): number {
  switch (colonne) {
    case "titre":
      return a.titre.localeCompare(b.titre) * (croissant ? 1 : -1);
    case "mesureTitre":
      return a.mesureTitre.localeCompare(b.mesureTitre) * (croissant ? 1 : -1);
    case "type":
      return (
        LIBELLES_TYPE_ACTION[a.type].localeCompare(LIBELLES_TYPE_ACTION[b.type]) *
        (croissant ? 1 : -1)
      );
    case "datePrevisionnelleDebut":
      return (
        comparerDatesNullables(a.datePrevisionnelleDebut, b.datePrevisionnelleDebut) *
        (croissant ? 1 : -1)
      );
    case "datePrevisionnelleFin":
      return (
        comparerDatesNullables(a.datePrevisionnelleFin, b.datePrevisionnelleFin) *
        (croissant ? 1 : -1)
      );
    case "tauxAvancement":
      return (a.tauxAvancement - b.tauxAvancement) * (croissant ? 1 : -1);
    case "bloquee":
      return (Number(a.bloquee) - Number(b.bloquee)) * (croissant ? 1 : -1);
  }
}

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
        Mesure
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

const LigneAction = ({
  action,
  peutGerer,
}: {
  action: ActionAvecMesure;
  peutGerer: boolean;
}) => {
  const utils = trpc.useContext();
  const invalider = () => utils.actions.lister.invalidate();
  const saisir = trpc.actions.saisirAvancement.useMutation({
    onSuccess: invalider,
  });
  const modifierDates = trpc.actions.modifierDatesPrevisionnelles.useMutation({
    onSuccess: invalider,
  });
  const supprimer = trpc.actions.supprimer.useMutation({ onSuccess: invalider });
  const [valeur, setValeur] = useState(String(action.tauxAvancement));
  const [datePrevisionnelleDebut, setDatePrevisionnelleDebut] = useState(
    versValeurInput(action.datePrevisionnelleDebut),
  );
  const [datePrevisionnelleFin, setDatePrevisionnelleFin] = useState(
    versValeurInput(action.datePrevisionnelleFin),
  );
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] =
    useState(false);

  return (
    <tr className="border-t border-neutral-100">
      <td className="px-4 py-2">{action.titre}</td>
      <td className="px-4 py-2">
        <Link
          href={`/mesure/${action.mesureId}`}
          className="text-primary hover:underline"
        >
          {action.mesureTitre}
        </Link>
      </td>
      <td className="px-4 py-2 text-neutral-600">
        {LIBELLES_TYPE_ACTION[action.type]}
      </td>
      {peutGerer ? (
        <>
          <td className="px-4 py-2">
            <input
              type="date"
              value={datePrevisionnelleDebut}
              onChange={(event) => setDatePrevisionnelleDebut(event.target.value)}
              className="rounded border border-neutral-300 px-2 py-1"
            />
          </td>
          <td className="px-4 py-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={datePrevisionnelleFin}
                onChange={(event) => setDatePrevisionnelleFin(event.target.value)}
                className="rounded border border-neutral-300 px-2 py-1"
              />
              <button
                type="button"
                disabled={modifierDates.isPending}
                onClick={() =>
                  modifierDates.mutate({
                    id: action.id,
                    datePrevisionnelleDebut: datePrevisionnelleDebut || null,
                    datePrevisionnelleFin: datePrevisionnelleFin || null,
                  })
                }
                className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
              >
                Mettre à jour
              </button>
            </div>
            {modifierDates.error ? (
              <p className="mt-1 text-xs text-error">{modifierDates.error.message}</p>
            ) : null}
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-2 text-neutral-600">
            {action.datePrevisionnelleDebut
              ? new Date(action.datePrevisionnelleDebut).toLocaleDateString("fr-FR")
              : "—"}
          </td>
          <td className="px-4 py-2 text-neutral-600">
            {action.datePrevisionnelleFin
              ? new Date(action.datePrevisionnelleFin).toLocaleDateString("fr-FR")
              : "—"}
          </td>
        </>
      )}
      <td className="px-4 py-2">
        {peutGerer ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              saisir.mutate({ id: action.id, tauxAvancement: Number(valeur) });
            }}
          >
            <input
              type="number"
              min={0}
              max={100}
              value={valeur}
              onChange={(event) => setValeur(event.target.value)}
              className="w-20 rounded border border-neutral-300 px-2 py-1"
            />
            <span>%</span>
            <button
              type="submit"
              disabled={saisir.isPending}
              className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
            >
              Mettre à jour
            </button>
            {saisir.error ? (
              <span className="text-xs text-error">{saisir.error.message}</span>
            ) : null}
          </form>
        ) : (
          <BarreAvancement valeur={action.tauxAvancement} />
        )}
      </td>
      <td className="px-4 py-2">
        <BadgeBloquee action={action} peutGerer={peutGerer} onChanged={invalider} />
      </td>
      <td className="px-4 py-2">
        {peutGerer ? (
          <>
            <button
              type="button"
              onClick={() => setConfirmationSuppressionOuverte(true)}
              aria-label="Supprimer l'action"
              className="cursor-pointer rounded p-1.5 text-neutral-400 hover:bg-error/10 hover:text-error"
            >
              🗑
            </button>
            <ConfirmModal
              open={confirmationSuppressionOuverte}
              titre="Supprimer l'action"
              message={`Voulez-vous vraiment supprimer l'action "${action.titre}" ? Cette opération est irréversible.`}
              libelleConfirmation="Supprimer"
              enCours={supprimer.isPending}
              erreur={supprimer.error?.message ?? null}
              onConfirmer={() =>
                supprimer.mutate(
                  { id: action.id },
                  { onSuccess: () => setConfirmationSuppressionOuverte(false) },
                )
              }
              onAnnuler={() => setConfirmationSuppressionOuverte(false)}
            />
          </>
        ) : null}
      </td>
    </tr>
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
  const [tri, setTri] = useState<{ colonne: Colonne; croissant: boolean }>({
    colonne: "titre",
    croissant: true,
  });

  const basculerTri = (colonne: Colonne) => {
    setTri((triActuel) =>
      triActuel.colonne === colonne
        ? { colonne, croissant: !triActuel.croissant }
        : { colonne, croissant: true },
    );
  };

  const actionsTriees = useMemo(
    () => actions && [...actions].sort((a, b) => comparerActions(a, b, tri.colonne, tri.croissant)),
    [actions, tri],
  );

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
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-neutral-100 text-left text-neutral-600">
              <tr>
                {COLONNES.map((colonne) => (
                  <th key={colonne.cle} className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => basculerTri(colonne.cle)}
                      className="flex items-center gap-1 font-medium hover:text-neutral-900"
                    >
                      {colonne.libelle}
                      <span className="text-xs text-neutral-400">
                        {tri.colonne === colonne.cle
                          ? tri.croissant
                            ? "▲"
                            : "▼"
                          : "↕"}
                      </span>
                    </button>
                  </th>
                ))}
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {actionsTriees?.map((action) => (
                <LigneAction key={action.id} action={action} peutGerer={peutGerer} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {actions && actions.length > 0 && vue === "calendrier" ? (
        <VueCalendrierActions actions={actions} />
      ) : null}
    </Layout>
  );
};

export default PageActions;
