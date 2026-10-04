import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState, FormEvent } from "react";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { trpc } from "@/client/utils/trpc";
import { Layout } from "@/client/components/Layout";
import {
  LIBELLES_STATUT_MESURE,
  ORDRE_STATUT_MESURE,
  StatutMesure,
} from "@/server/mesures/domain/StatutMesure";
import { LIBELLES_MESURE_PRIORITAIRE } from "@/server/mesures/domain/MesurePrioritaire";
import { LIBELLES_TYPE_ACTION, TypeAction } from "@/server/actions/domain/TypeAction";
import { GraphiqueEvolutionIndicateurs } from "@/client/components/mesures/GraphiqueEvolutionIndicateurs";
import { BadgeBloquee } from "@/client/components/BadgeBloquee";
import { Modal } from "@/client/components/Modal";
import { BarreAvancement } from "@/client/components/BarreAvancement";
import { InfoBulle } from "@/client/components/InfoBulle";
import { couleurSelonValeur } from "@/client/utils/couleurSelonValeur";
import { ConfirmModal } from "@/client/components/ConfirmModal";
import { SensEvolution } from "@/server/indicateurs-impact/domain/SensEvolution";

export const getServerSideProps: GetServerSideProps<
  Record<string, never>,
  { id: string }
> = async (context) => {
  const session = await auth(context);
  if (!session) {
    return { redirect: { destination: "/connexion", permanent: false } };
  }
  return { props: {} };
};

function versValeurInput(date: Date | null): string {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

const FormulaireNouvelleAction = ({
  mesureId,
  onCreated,
}: {
  mesureId: string;
  onCreated: () => void;
}) => {
  const utils = trpc.useContext();
  const creer = trpc.actions.creer.useMutation({
    onSuccess: () => utils.actions.listerParMesure.invalidate({ mesureId }),
  });
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<TypeAction>("JURIDIQUE");
  const [datePrevisionnelleDebut, setDatePrevisionnelleDebut] = useState("");
  const [datePrevisionnelleFin, setDatePrevisionnelleFin] = useState("");

  const soumettre = (event: FormEvent) => {
    event.preventDefault();
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
        disabled={creer.isPending || !titre}
        className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
      >
        Ajouter l'action
      </button>
      {creer.error ? <p className="text-sm text-error">{creer.error.message}</p> : null}
    </form>
  );
};

type ActionDeLaMesure = {
  id: string;
  titre: string;
  type: TypeAction;
  tauxAvancement: number;
  datePrevisionnelleDebut: Date | null;
  datePrevisionnelleFin: Date | null;
  bloquee: boolean;
  raisonBlocage: string | null;
  precisionArbitrage: string | null;
};

type ColonneAction =
  | "titre"
  | "type"
  | "datePrevisionnelleDebut"
  | "datePrevisionnelleFin"
  | "tauxAvancement"
  | "bloquee";

const COLONNES_ACTIONS: { cle: ColonneAction; libelle: string }[] = [
  { cle: "titre", libelle: "Titre" },
  { cle: "type", libelle: "Type" },
  { cle: "datePrevisionnelleDebut", libelle: "Début prévisionnel" },
  { cle: "datePrevisionnelleFin", libelle: "Fin prévisionnelle" },
  { cle: "tauxAvancement", libelle: "Avancement" },
  { cle: "bloquee", libelle: "Bloquée" },
];

type TriActions = { colonne: ColonneAction; croissant: boolean };

function comparerDatesNullables(a: Date | null, b: Date | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
}

function comparerActions(
  a: ActionDeLaMesure,
  b: ActionDeLaMesure,
  { colonne, croissant }: TriActions,
): number {
  const sens = croissant ? 1 : -1;
  switch (colonne) {
    case "titre":
      return a.titre.localeCompare(b.titre) * sens;
    case "type":
      return (
        LIBELLES_TYPE_ACTION[a.type].localeCompare(LIBELLES_TYPE_ACTION[b.type]) *
        sens
      );
    case "datePrevisionnelleDebut":
      return (
        comparerDatesNullables(a.datePrevisionnelleDebut, b.datePrevisionnelleDebut) *
        sens
      );
    case "datePrevisionnelleFin":
      return (
        comparerDatesNullables(a.datePrevisionnelleFin, b.datePrevisionnelleFin) *
        sens
      );
    case "tauxAvancement":
      return (a.tauxAvancement - b.tauxAvancement) * sens;
    case "bloquee":
      return (Number(a.bloquee) - Number(b.bloquee)) * sens;
  }
}

const EnTeteTrie = ({
  colonne,
  tri,
  onClick,
}: {
  colonne: { cle: ColonneAction; libelle: string };
  tri: TriActions | null;
  onClick: (colonne: ColonneAction) => void;
}) => {
  const actif = tri?.colonne === colonne.cle;
  return (
    <th
      scope="col"
      aria-sort={actif ? (tri.croissant ? "ascending" : "descending") : "none"}
      className="px-3 py-2"
    >
      <button
        type="button"
        onClick={() => onClick(colonne.cle)}
        className="flex cursor-pointer items-center gap-1 text-left font-medium hover:text-neutral-900"
      >
        {colonne.libelle}
        <span aria-hidden="true" className="text-xs text-neutral-600">
          {actif ? (tri.croissant ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
};

const STYLES_STATUT_MESURE: Record<StatutMesure, string> = {
  A_L_ETUDE: "bg-blue-100 text-blue-800 ring-blue-300",
  ACTEE: "bg-green-100 text-green-800 ring-green-300",
  ABANDONNEE: "bg-neutral-200 text-neutral-700 ring-neutral-400",
};

const CLASSES_BADGE_STATUT =
  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset";

const BadgeStatutMesure = ({ statut }: { statut: StatutMesure }) => (
  <span className={`${CLASSES_BADGE_STATUT} ${STYLES_STATUT_MESURE[statut]}`}>
    {LIBELLES_STATUT_MESURE[statut]}
  </span>
);

const CarteKpi = ({
  libelle,
  detail,
  valeur,
}: {
  libelle: string;
  detail: string;
  valeur: number | null;
}) => {
  const pourcentage = valeur === null ? 0 : Math.max(0, Math.min(100, valeur));
  const couleur = couleurSelonValeur(pourcentage);
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 print:break-inside-avoid">
      <p className="text-sm font-medium text-neutral-700">{libelle}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className={`text-3xl font-semibold ${
            valeur === null ? "text-neutral-600" : couleur.texte
          }`}
        >
          {valeur === null ? "—" : `${Math.round(pourcentage)}%`}
        </span>
        <span className="text-xs text-neutral-600">{detail}</span>
      </div>
      <div
        role="progressbar"
        aria-label={libelle}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valeur === null ? undefined : Math.round(pourcentage)}
        className="mt-2 h-2 rounded-full bg-neutral-200"
      >
        <div
          className={`h-2 rounded-full ${couleur.barre}`}
          style={{ width: `${pourcentage}%` }}
        />
      </div>
    </div>
  );
};

const LigneAction = ({
  action,
  peutSaisir,
}: {
  action: ActionDeLaMesure;
  peutSaisir: boolean;
}) => {
  const utils = trpc.useContext();
  const invalider = () => {
    utils.actions.listerParMesure.invalidate();
    utils.mesures.recuperer.invalidate();
    utils.mesures.lister.invalidate();
  };
  const saisir = trpc.actions.saisirAvancement.useMutation({
    onSuccess: invalider,
  });
  const modifierDates = trpc.actions.modifierDatesPrevisionnelles.useMutation({
    onSuccess: invalider,
  });
  const [enEdition, setEnEdition] = useState(false);
  const [valeur, setValeur] = useState(String(action.tauxAvancement));
  const [datePrevisionnelleDebut, setDatePrevisionnelleDebut] = useState(
    versValeurInput(action.datePrevisionnelleDebut),
  );
  const [datePrevisionnelleFin, setDatePrevisionnelleFin] = useState(
    versValeurInput(action.datePrevisionnelleFin),
  );

  const annuler = () => {
    setEnEdition(false);
    setValeur(String(action.tauxAvancement));
    setDatePrevisionnelleDebut(versValeurInput(action.datePrevisionnelleDebut));
    setDatePrevisionnelleFin(versValeurInput(action.datePrevisionnelleFin));
    saisir.reset();
    modifierDates.reset();
  };

  // Les deux champs se mettent à jour d'un seul clic ; on n'appelle que les
  // mutations dont la valeur a réellement changé.
  const enregistrer = async () => {
    const datesModifiees =
      datePrevisionnelleDebut !== versValeurInput(action.datePrevisionnelleDebut) ||
      datePrevisionnelleFin !== versValeurInput(action.datePrevisionnelleFin);
    const avancementModifie = Number(valeur) !== action.tauxAvancement;
    try {
      if (datesModifiees) {
        await modifierDates.mutateAsync({
          id: action.id,
          datePrevisionnelleDebut: datePrevisionnelleDebut || null,
          datePrevisionnelleFin: datePrevisionnelleFin || null,
        });
      }
      if (avancementModifie) {
        await saisir.mutateAsync({ id: action.id, tauxAvancement: Number(valeur) });
      }
      setEnEdition(false);
    } catch {
      // L'erreur est affichée dans la ligne via `.error` de chaque mutation.
    }
  };

  const enCours = saisir.isPending || modifierDates.isPending;
  const formaterDate = (date: Date | null) =>
    date ? new Date(date).toLocaleDateString("fr-FR") : "—";

  return (
    <tr className="border-t border-neutral-100">
      <td className="px-3 py-2">{action.titre}</td>
      <td className="px-3 py-2">{LIBELLES_TYPE_ACTION[action.type]}</td>
      {enEdition ? (
        <>
          <td className="px-3 py-2">
            <input
              type="date"
              value={datePrevisionnelleDebut}
              onChange={(event) => setDatePrevisionnelleDebut(event.target.value)}
              aria-label={`Début prévisionnel de l'action « ${action.titre} »`}
              className="w-36 rounded border border-neutral-300 px-2 py-1"
            />
          </td>
          <td className="px-3 py-2">
            <input
              type="date"
              value={datePrevisionnelleFin}
              onChange={(event) => setDatePrevisionnelleFin(event.target.value)}
              aria-label={`Fin prévisionnelle de l'action « ${action.titre} »`}
              className="w-36 rounded border border-neutral-300 px-2 py-1"
            />
            {modifierDates.error ? (
              <p className="mt-1 text-xs text-error">{modifierDates.error.message}</p>
            ) : null}
          </td>
        </>
      ) : (
        <>
          <td className="px-3 py-2 text-neutral-600">
            {formaterDate(action.datePrevisionnelleDebut)}
          </td>
          <td className="px-3 py-2 text-neutral-600">
            {formaterDate(action.datePrevisionnelleFin)}
          </td>
        </>
      )}
      <td className="px-3 py-2">
        {enEdition ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={valeur}
                onChange={(event) => setValeur(event.target.value)}
                aria-label={`Avancement de l'action « ${action.titre} » en pourcentage`}
                className="w-20 rounded border border-neutral-300 px-2 py-1"
              />
              <span>%</span>
            </div>
            <BarreAvancement valeur={action.tauxAvancement} afficherValeur={false} />
            {saisir.error ? (
              <p className="text-xs text-error">{saisir.error.message}</p>
            ) : null}
          </div>
        ) : (
          <BarreAvancement valeur={action.tauxAvancement} />
        )}
      </td>
      <td className="px-3 py-2">
        <BadgeBloquee
          action={action}
          peutGerer={peutSaisir}
          onChanged={invalider}
          afficherInfo={false}
        />
        {action.bloquee && action.raisonBlocage ? (
          <p className="mt-1 max-w-[12rem] whitespace-pre-wrap text-xs text-neutral-700">
            {action.raisonBlocage}
          </p>
        ) : null}
        {action.bloquee && action.precisionArbitrage ? (
          <p className="mt-1 max-w-[12rem] whitespace-pre-wrap text-xs text-neutral-700">
            <span className="font-medium">Arbitrage demandé :</span>{" "}
            {action.precisionArbitrage}
          </p>
        ) : null}
      </td>
      {peutSaisir ? (
        <td className="px-3 py-2 print:hidden">
          <div className="flex flex-col items-stretch gap-1">
            {enEdition ? (
              <>
                <button
                  type="button"
                  onClick={enregistrer}
                  disabled={enCours}
                  className="rounded bg-primary px-2 py-1 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={annuler}
                  disabled={enCours}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 disabled:opacity-50"
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEnEdition(true)}
                className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
              >
                Mettre à jour
              </button>
            )}
          </div>
        </td>
      ) : null}
    </tr>
  );
};

/**
 * Champs nom/valeurs/sens, partagés entre les formulaires d'ajout et de
 * modification d'un indicateur d'impact.
 */
const ChampsIndicateur = ({
  nom,
  onNomChange,
  valeurInitiale,
  onValeurInitialeChange,
  valeurCible,
  onValeurCibleChange,
  sensEvolution,
  onSensEvolutionChange,
}: {
  nom: string;
  onNomChange: (valeur: string) => void;
  valeurInitiale: string;
  onValeurInitialeChange: (valeur: string) => void;
  valeurCible: string;
  onValeurCibleChange: (valeur: string) => void;
  sensEvolution: SensEvolution;
  onSensEvolutionChange: (valeur: SensEvolution) => void;
}) => (
  <>
    <label className="flex flex-col gap-1 text-sm text-neutral-700">
      Nom de l'indicateur
      <input
        value={nom}
        onChange={(event) => onNomChange(event.target.value)}
        className="rounded border border-neutral-300 px-3 py-2"
      />
    </label>
    <label className="flex flex-col gap-1 text-sm text-neutral-700">
      Valeur initiale
      <input
        type="number"
        value={valeurInitiale}
        onChange={(event) => onValeurInitialeChange(event.target.value)}
        className="rounded border border-neutral-300 px-3 py-2"
      />
    </label>
    <label className="flex flex-col gap-1 text-sm text-neutral-700">
      Valeur cible
      <input
        type="number"
        value={valeurCible}
        onChange={(event) => onValeurCibleChange(event.target.value)}
        className="rounded border border-neutral-300 px-3 py-2"
      />
    </label>
    <label className="flex flex-col gap-1 text-sm text-neutral-700">
      Sens d'évolution
      <select
        value={sensEvolution}
        onChange={(event) => onSensEvolutionChange(event.target.value as SensEvolution)}
        className="rounded border border-neutral-300 px-3 py-2"
      >
        <option value="A_LA_HAUSSE">À la hausse</option>
        <option value="A_LA_BAISSE">À la baisse</option>
      </select>
    </label>
  </>
);

const FormulaireNouvelIndicateur = ({
  mesureId,
  onCreated,
}: {
  mesureId: string;
  onCreated: () => void;
}) => {
  const utils = trpc.useContext();
  const creer = trpc.indicateursImpact.creer.useMutation({
    onSuccess: () =>
      utils.indicateursImpact.listerParMesure.invalidate({ mesureId }),
  });
  const [nom, setNom] = useState("");
  const [valeurInitiale, setValeurInitiale] = useState("0");
  const [valeurCible, setValeurCible] = useState("0");
  const [sensEvolution, setSensEvolution] = useState<SensEvolution>("A_LA_HAUSSE");

  const soumettre = (event: FormEvent) => {
    event.preventDefault();
    creer.mutate(
      {
        mesureId,
        nom,
        unite: null,
        sensEvolution,
        valeurInitiale: Number(valeurInitiale),
        valeurCible: Number(valeurCible),
      },
      {
        onSuccess: () => {
          setNom("");
          onCreated();
        },
      },
    );
  };

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      <ChampsIndicateur
        nom={nom}
        onNomChange={setNom}
        valeurInitiale={valeurInitiale}
        onValeurInitialeChange={setValeurInitiale}
        valeurCible={valeurCible}
        onValeurCibleChange={setValeurCible}
        sensEvolution={sensEvolution}
        onSensEvolutionChange={setSensEvolution}
      />
      <button
        type="submit"
        disabled={creer.isPending || !nom}
        className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
      >
        Ajouter l'indicateur
      </button>
      {creer.error ? <p className="text-sm text-error">{creer.error.message}</p> : null}
    </form>
  );
};

const FormulaireModifierIndicateur = ({
  indicateur,
  onModifie,
}: {
  indicateur: {
    id: string;
    mesureId: string;
    nom: string;
    sensEvolution: SensEvolution;
    valeurInitiale: number;
    valeurCible: number;
    unite: string | null;
  };
  onModifie: () => void;
}) => {
  const utils = trpc.useContext();
  const modifier = trpc.indicateursImpact.modifier.useMutation({
    onSuccess: () =>
      utils.indicateursImpact.listerParMesure.invalidate({
        mesureId: indicateur.mesureId,
      }),
  });
  const [nom, setNom] = useState(indicateur.nom);
  const [valeurInitiale, setValeurInitiale] = useState(String(indicateur.valeurInitiale));
  const [valeurCible, setValeurCible] = useState(String(indicateur.valeurCible));
  const [sensEvolution, setSensEvolution] = useState<SensEvolution>(
    indicateur.sensEvolution,
  );

  const soumettre = (event: FormEvent) => {
    event.preventDefault();
    modifier.mutate(
      {
        id: indicateur.id,
        nom,
        unite: indicateur.unite,
        sensEvolution,
        valeurInitiale: Number(valeurInitiale),
        valeurCible: Number(valeurCible),
      },
      { onSuccess: onModifie },
    );
  };

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      <ChampsIndicateur
        nom={nom}
        onNomChange={setNom}
        valeurInitiale={valeurInitiale}
        onValeurInitialeChange={setValeurInitiale}
        valeurCible={valeurCible}
        onValeurCibleChange={setValeurCible}
        sensEvolution={sensEvolution}
        onSensEvolutionChange={setSensEvolution}
      />
      <button
        type="submit"
        disabled={modifier.isPending || !nom}
        className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
      >
        Enregistrer
      </button>
      {modifier.error ? (
        <p className="text-sm text-error">{modifier.error.message}</p>
      ) : null}
    </form>
  );
};

const LigneIndicateur = ({
  indicateur,
  mesureId,
  peutGerer,
}: {
  indicateur: {
    id: string;
    nom: string;
    unite: string | null;
    sensEvolution: SensEvolution;
    valeurInitiale: number;
    valeurCible: number;
    valeurActuelle: number | null;
    tauxRealisation: number | null;
  };
  mesureId: string;
  peutGerer: boolean;
}) => {
  const utils = trpc.useContext();
  const supprimer = trpc.indicateursImpact.supprimer.useMutation({
    onSuccess: () =>
      utils.indicateursImpact.listerParMesure.invalidate({ mesureId }),
  });
  const [modaleModificationOuverte, setModaleModificationOuverte] = useState(false);
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] =
    useState(false);

  return (
    <tr className="border-t border-neutral-100">
      <td className="px-4 py-2">
        <Link
          href={`/mesure/${mesureId}/indicateur/${indicateur.id}`}
          className="text-primary hover:underline"
        >
          {indicateur.nom}
        </Link>
      </td>
      <td className="px-4 py-2">{indicateur.valeurInitiale}</td>
      <td className="px-4 py-2">{indicateur.valeurActuelle ?? "—"}</td>
      <td className="px-4 py-2">{indicateur.valeurCible}</td>
      <td className="px-4 py-2">
        {indicateur.tauxRealisation === null
          ? "—"
          : `${Math.round(indicateur.tauxRealisation)}%`}
      </td>
      <td className="px-4 py-2 print:hidden">
        <div className="flex items-center gap-1">
          <Link
            href={`/mesure/${mesureId}/indicateur/${indicateur.id}`}
            className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
          >
            Mettre à jour
          </Link>
          {peutGerer ? (
            <>
              <button
                type="button"
                onClick={() => setModaleModificationOuverte(true)}
                className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
              >
                Modifier
              </button>
              <Modal
                open={modaleModificationOuverte}
                titre="Modifier l'indicateur clé"
                onFermer={() => setModaleModificationOuverte(false)}
              >
                <FormulaireModifierIndicateur
                  indicateur={{ ...indicateur, mesureId }}
                  onModifie={() => setModaleModificationOuverte(false)}
                />
              </Modal>
              <button
                type="button"
                onClick={() => setConfirmationSuppressionOuverte(true)}
                aria-label="Supprimer l'indicateur"
                className="cursor-pointer rounded p-1.5 text-neutral-600 hover:bg-error/10 hover:text-error"
              >
                🗑
              </button>
              <ConfirmModal
                open={confirmationSuppressionOuverte}
                titre="Supprimer l'indicateur"
                message={`Voulez-vous vraiment supprimer l'indicateur "${indicateur.nom}" ? Cette opération est irréversible.`}
                libelleConfirmation="Supprimer"
                enCours={supprimer.isPending}
                erreur={supprimer.error?.message ?? null}
                onConfirmer={() =>
                  supprimer.mutate(
                    { id: indicateur.id },
                    { onSuccess: () => setConfirmationSuppressionOuverte(false) },
                  )
                }
                onAnnuler={() => setConfirmationSuppressionOuverte(false)}
              />
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
};

const SelecteurStatutMesure = ({
  mesureId,
  statutActuel,
}: {
  mesureId: string;
  statutActuel: StatutMesure;
}) => {
  const utils = trpc.useContext();
  const modifier = trpc.mesures.modifierStatut.useMutation({
    onSuccess: () => {
      utils.mesures.recuperer.invalidate({ id: mesureId });
      utils.mesures.lister.invalidate();
    },
  });

  return (
    <div className="flex items-center gap-2">
      <select
        value={statutActuel}
        aria-label="Statut de l'objectif"
        onChange={(event) =>
          modifier.mutate({
            id: mesureId,
            statut: event.target.value as StatutMesure,
          })
        }
        disabled={modifier.isPending}
        className={`${CLASSES_BADGE_STATUT} ${STYLES_STATUT_MESURE[statutActuel]} cursor-pointer disabled:opacity-50`}
      >
        {ORDRE_STATUT_MESURE.map((statut) => (
          <option key={statut} value={statut}>
            {LIBELLES_STATUT_MESURE[statut]}
          </option>
        ))}
      </select>
      {modifier.error ? (
        <span className="text-xs text-error">{modifier.error.message}</span>
      ) : null}
    </div>
  );
};

const PageDetailMesure = () => {
  const router = useRouter();
  const mesureId = typeof router.query.id === "string" ? router.query.id : "";
  const [vueIndicateurs, setVueIndicateurs] = useState<"tableau" | "graphique">(
    "tableau",
  );
  const [modaleCreationActionOuverte, setModaleCreationActionOuverte] =
    useState(false);
  const [modaleCreationIndicateurOuverte, setModaleCreationIndicateurOuverte] =
    useState(false);

  const { data: utilisateur } =
    trpc.profilUtilisateur.getUtilisateurConnecte.useQuery();
  const { data: mesure, isLoading: mesureEnChargement } =
    trpc.mesures.recuperer.useQuery(
      { id: mesureId },
      { enabled: mesureId !== "" },
    );
  const { data: actions } = trpc.actions.listerParMesure.useQuery(
    { mesureId },
    { enabled: mesureId !== "" },
  );
  const { data: indicateurs } = trpc.indicateursImpact.listerParMesure.useQuery(
    { mesureId },
    { enabled: mesureId !== "" },
  );

  const [triActions, setTriActions] = useState<TriActions | null>(null);
  const basculerTriActions = (colonne: ColonneAction) =>
    setTriActions((actuel) =>
      actuel?.colonne === colonne
        ? { colonne, croissant: !actuel.croissant }
        : { colonne, croissant: true },
    );
  const actionsTriees = useMemo(
    () =>
      actions && triActions
        ? [...actions].sort((a, b) => comparerActions(a, b, triActions))
        : actions,
    [actions, triActions],
  );

  if (mesureEnChargement) {
    return (
      <Layout>
        <p className="text-neutral-600">Chargement…</p>
      </Layout>
    );
  }

  if (!mesure) {
    return (
      <Layout>
        <p className="text-neutral-600">
          Objectif introuvable, ou vous n'avez pas les droits pour le consulter.
        </p>
      </Layout>
    );
  }

  const estAdmin = utilisateur?.profil === "ADMIN_OUTIL";
  const estPresident = utilisateur?.profil === "PRESIDENT";
  const estDirectionNc =
    utilisateur?.profil === "DIRECTION_NC" &&
    utilisateur.habilitationsSecteur.includes(mesure.secteurId);

  return (
    <Layout>
      <Head>
        <title>{mesure.titre} - PILOTE Nouvelle-Calédonie</title>
      </Head>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          ← Retour au tableau de bord
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          <span aria-hidden="true">🖨</span>
          Imprimer
        </button>
      </div>
      <p className="hidden text-xs text-neutral-600 print:block">
        PILOTE Nouvelle-Calédonie — fiche imprimée le{" "}
        {new Date().toLocaleDateString("fr-FR")}
      </p>

      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-secondary">
        {LIBELLES_MESURE_PRIORITAIRE[mesure.mesurePrioritaire]}
      </p>
      <p className="text-xs text-neutral-600">{mesure.code}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-neutral-800">
          {mesure.titre}
        </h1>
        {estAdmin || estPresident ? (
          <SelecteurStatutMesure mesureId={mesure.id} statutActuel={mesure.statut} />
        ) : (
          <BadgeStatutMesure statut={mesure.statut} />
        )}
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5 print:break-inside-avoid">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-neutral-800">Progression globale</h2>
          <InfoBulle libelle="Comment sont calculées ces moyennes ?">
            <p>
              <strong>Actions :</strong> moyenne automatique du taux d'avancement
              des actions liées.
            </p>
            <p className="mt-2">
              <strong>Indicateurs clés :</strong> moyenne automatique du taux de
              réalisation des indicateurs clés.
            </p>
          </InfoBulle>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CarteKpi
            libelle="Avancement des actions"
            detail={`${mesure.nombreActions} action${mesure.nombreActions > 1 ? "s" : ""}`}
            valeur={mesure.meteoAvancement}
          />
          <CarteKpi
            libelle="Réalisation des indicateurs clés"
            detail={`${mesure.nombreIndicateurs} indicateur${mesure.nombreIndicateurs > 1 ? "s" : ""}`}
            valeur={mesure.tauxAvancementIndicateurs}
          />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium text-neutral-800">Actions</h2>
          {estAdmin || estDirectionNc ? (
            <button
              type="button"
              onClick={() => setModaleCreationActionOuverte(true)}
              className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover print:hidden"
            >
              Ajouter une action
            </button>
          ) : null}
        </div>
        <div className="mt-3 overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-sm">
            <thead className="text-left text-neutral-600">
              <tr>
                {COLONNES_ACTIONS.map((colonne) => (
                  <EnTeteTrie
                    key={colonne.cle}
                    colonne={colonne}
                    tri={triActions}
                    onClick={basculerTriActions}
                  />
                ))}
                {estDirectionNc ? (
                  <th scope="col" className="px-3 py-2 font-medium print:hidden">
                    Options
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {actionsTriees?.map((action) => (
                <LigneAction
                  key={action.id}
                  action={action}
                  peutSaisir={estDirectionNc}
                />
              ))}
            </tbody>
          </table>
        </div>
        {estAdmin || estDirectionNc ? (
          <Modal
            open={modaleCreationActionOuverte}
            titre="Ajouter une action"
            onFermer={() => setModaleCreationActionOuverte(false)}
          >
            <FormulaireNouvelleAction
              mesureId={mesure.id}
              onCreated={() => setModaleCreationActionOuverte(false)}
            />
          </Modal>
        ) : null}
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium text-neutral-800">
            Indicateurs clés
          </h2>
          <div className="flex items-center gap-3 print:hidden">
            <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
              {(
                [
                  { id: "tableau", libelle: "Tableau" },
                  { id: "graphique", libelle: "Graphique" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setVueIndicateurs(option.id)}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    vueIndicateurs === option.id
                      ? "bg-primary text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {option.libelle}
                </button>
              ))}
            </div>
            {estAdmin ? (
              <button
                type="button"
                onClick={() => setModaleCreationIndicateurOuverte(true)}
                className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Ajouter un indicateur
              </button>
            ) : null}
          </div>
        </div>

        {vueIndicateurs === "tableau" ? (
          <table className="mt-3 w-full border-collapse text-sm">
            <thead className="text-left text-neutral-600">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Valeur initiale</th>
                <th className="px-4 py-2">Valeur actuelle</th>
                <th className="px-4 py-2">Cible</th>
                <th className="px-4 py-2">Taux de réalisation</th>
                <th className="px-4 py-2 print:hidden">Options</th>
              </tr>
            </thead>
            <tbody>
              {indicateurs?.map((indicateur) => (
                <LigneIndicateur
                  key={indicateur.id}
                  indicateur={indicateur}
                  mesureId={mesure.id}
                  peutGerer={estAdmin}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mt-3">
            {indicateurs && indicateurs.length > 0 ? (
              <GraphiqueEvolutionIndicateurs indicateurs={indicateurs} />
            ) : null}
          </div>
        )}

        {estAdmin ? (
          <Modal
            open={modaleCreationIndicateurOuverte}
            titre="Ajouter un indicateur clé"
            onFermer={() => setModaleCreationIndicateurOuverte(false)}
          >
            <FormulaireNouvelIndicateur
              mesureId={mesure.id}
              onCreated={() => setModaleCreationIndicateurOuverte(false)}
            />
          </Modal>
        ) : null}
      </section>
    </Layout>
  );
};

export default PageDetailMesure;
