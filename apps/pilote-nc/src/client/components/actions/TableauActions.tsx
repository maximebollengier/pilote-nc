import Link from "next/link";
import { useMemo, useState } from "react";
import { trpc } from "@/client/utils/trpc";
import { BadgeBloquee } from "@/client/components/BadgeBloquee";
import { BarreAvancement } from "@/client/components/BarreAvancement";
import { ConfirmModal } from "@/client/components/ConfirmModal";
import { LIBELLES_TYPE_ACTION, TypeAction } from "@/server/actions/domain/TypeAction";

export type ActionTableau = {
  id: string;
  titre: string;
  type: TypeAction;
  tauxAvancement: number;
  datePrevisionnelleDebut: Date | null;
  datePrevisionnelleFin: Date | null;
  bloquee: boolean;
  raisonBlocage: string | null;
  precisionArbitrage: string | null;
  mesureId?: string;
  mesureTitre?: string;
};

type ColonneAction =
  | "titre"
  | "mesureTitre"
  | "type"
  | "datePrevisionnelleDebut"
  | "datePrevisionnelleFin"
  | "tauxAvancement"
  | "bloquee";

type TriActions = { colonne: ColonneAction; croissant: boolean };

function versValeurInput(date: Date | null): string {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

function comparerDatesNullables(a: Date | null, b: Date | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
}

function comparerActions(
  a: ActionTableau,
  b: ActionTableau,
  { colonne, croissant }: TriActions,
): number {
  const sens = croissant ? 1 : -1;
  switch (colonne) {
    case "titre":
      return a.titre.localeCompare(b.titre) * sens;
    case "mesureTitre":
      return (a.mesureTitre ?? "").localeCompare(b.mesureTitre ?? "") * sens;
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

const LigneAction = ({
  action,
  peutGerer,
  afficherObjectif,
  peutSupprimer,
}: {
  action: ActionTableau;
  peutGerer: boolean;
  afficherObjectif: boolean;
  peutSupprimer: boolean;
}) => {
  const utils = trpc.useContext();
  const invalider = () => {
    utils.actions.lister.invalidate();
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
  const supprimer = trpc.actions.supprimer.useMutation({ onSuccess: invalider });
  const [enEdition, setEnEdition] = useState(false);
  const [valeur, setValeur] = useState(String(action.tauxAvancement));
  const [datePrevisionnelleDebut, setDatePrevisionnelleDebut] = useState(
    versValeurInput(action.datePrevisionnelleDebut),
  );
  const [datePrevisionnelleFin, setDatePrevisionnelleFin] = useState(
    versValeurInput(action.datePrevisionnelleFin),
  );
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] =
    useState(false);

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
      {afficherObjectif ? (
        <td className="px-3 py-2">
          <Link
            href={`/mesure/${action.mesureId}`}
            className="text-primary hover:underline"
          >
            {action.mesureTitre}
          </Link>
        </td>
      ) : null}
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
          peutGerer={peutGerer}
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
      {peutGerer ? (
        <td className="px-3 py-2 print:hidden">
          {enEdition ? (
            <div className="flex flex-col items-stretch gap-1">
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
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEnEdition(true)}
                className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
              >
                Mettre à jour
              </button>
              {peutSupprimer ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmationSuppressionOuverte(true)}
                    aria-label="Supprimer l'action"
                    className="cursor-pointer rounded p-1.5 text-neutral-600 hover:bg-error/10 hover:text-error"
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
            </div>
          )}
        </td>
      ) : null}
    </tr>
  );
};

/**
 * Tableau des actions partagé par la fiche objectif et la page Actions :
 * colonnes triables, barre d'avancement, motif de blocage visible, et colonne
 * « Options » (« Mettre à jour » pour modifier dates + avancement d'un coup).
 */
export const TableauActions = ({
  actions,
  peutGerer,
  afficherObjectif = false,
  peutSupprimer = false,
  triInitial = null,
}: {
  actions: ActionTableau[] | undefined;
  peutGerer: boolean;
  afficherObjectif?: boolean;
  peutSupprimer?: boolean;
  triInitial?: TriActions | null;
}) => {
  const [tri, setTri] = useState<TriActions | null>(triInitial);
  const basculerTri = (colonne: ColonneAction) =>
    setTri((actuel) =>
      actuel?.colonne === colonne
        ? { colonne, croissant: !actuel.croissant }
        : { colonne, croissant: true },
    );
  const actionsTriees = useMemo(
    () =>
      actions && tri ? [...actions].sort((a, b) => comparerActions(a, b, tri)) : actions,
    [actions, tri],
  );

  const colonnes: { cle: ColonneAction; libelle: string }[] = [
    { cle: "titre", libelle: "Titre" },
    ...(afficherObjectif
      ? [{ cle: "mesureTitre" as const, libelle: "Objectif" }]
      : []),
    { cle: "type", libelle: "Type" },
    { cle: "datePrevisionnelleDebut", libelle: "Début prévisionnel" },
    { cle: "datePrevisionnelleFin", libelle: "Fin prévisionnelle" },
    { cle: "tauxAvancement", libelle: "Avancement" },
    { cle: "bloquee", libelle: "Bloquée" },
  ];

  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full border-collapse text-sm">
        <thead className="text-left text-neutral-600">
          <tr>
            {colonnes.map((colonne) => (
              <EnTeteTrie
                key={colonne.cle}
                colonne={colonne}
                tri={tri}
                onClick={basculerTri}
              />
            ))}
            {peutGerer ? (
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
              peutGerer={peutGerer}
              afficherObjectif={afficherObjectif}
              peutSupprimer={peutSupprimer}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
