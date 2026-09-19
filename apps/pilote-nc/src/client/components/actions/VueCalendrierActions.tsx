import { useState } from "react";
import {
  LIBELLES_MESURE_PRIORITAIRE,
  ORDRE_MESURE_PRIORITAIRE,
  MesurePrioritaire,
} from "@/server/mesures/domain/MesurePrioritaire";
import { BoutonInfoBlocage } from "@/client/components/BadgeBloquee";

type ActionCalendrier = {
  id: string;
  titre: string;
  mesureTitre?: string;
  mesurePrioritaire: MesurePrioritaire;
  bloquee: boolean;
  raisonBlocage: string | null;
  precisionArbitrage: string | null;
  datePrevisionnelleDebut: Date | null;
  datePrevisionnelleFin: Date | null;
};

type Colonne = "titre" | "mesureTitre";

const COLONNES: { cle: Colonne; libelle: string; largeur: number }[] = [
  { cle: "titre", libelle: "Action", largeur: 200 },
  { cle: "mesureTitre", libelle: "Mesure", largeur: 200 },
];

const LIBELLES_MOIS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const COULEURS_MESURE_PRIORITAIRE: Record<MesurePrioritaire, string> = {
  MAITRISE_DEPENSES_PUBLIQUES_ET_EXEMPLARITE: "bg-blue-600",
  SAUVEGARDE_REGIMES_SOCIAUX: "bg-emerald-600",
  REFORME_RETRAITES_SECTEUR_PRIVE: "bg-amber-600",
  FISCALITE_ET_RELANCE_ECONOMIQUE: "bg-purple-600",
  POUVOIR_ACHAT_ET_URGENCE_SOCIALE: "bg-rose-600",
  NON_PRIORITAIRE: "bg-neutral-400",
};

// Du plus détaillé (zoom avant) au plus large (zoom arrière).
const GRANULARITES = ["mois", "trimestre", "annee"] as const;
type Granularite = (typeof GRANULARITES)[number];

const LIBELLES_GRANULARITE: Record<Granularite, string> = {
  mois: "Mois",
  trimestre: "Trimestre",
  annee: "Année",
};

const LARGEUR_COLONNE: Record<Granularite, number> = {
  mois: 56,
  trimestre: 64,
  annee: 72,
};

// Nombre de "mois" couverts par une unité de la granularité — sert à
// convertir un intervalle de mois (calculé une fois pour toutes) en nombre
// de colonnes, quelle que soit la granularité affichée.
const MOIS_PAR_UNITE: Record<Granularite, number> = {
  mois: 1,
  trimestre: 3,
  annee: 12,
};

function cléMois(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function cléPeriode(cléMoisAbsolue: number, granularite: Granularite): number {
  return Math.floor(cléMoisAbsolue / MOIS_PAR_UNITE[granularite]);
}

function libellePeriode(cléAbsolue: number, granularite: Granularite): string {
  switch (granularite) {
    case "mois": {
      const annee = Math.floor(cléAbsolue / 12);
      const mois = ((cléAbsolue % 12) + 12) % 12;
      return `${LIBELLES_MOIS[mois]} ${String(annee).slice(2)}`;
    }
    case "trimestre": {
      const annee = Math.floor(cléAbsolue / 4);
      const trimestre = ((cléAbsolue % 4) + 4) % 4;
      return `T${trimestre + 1} ${String(annee).slice(2)}`;
    }
    case "annee":
      return String(cléAbsolue);
  }
}

function comparerActions(
  a: ActionCalendrier,
  b: ActionCalendrier,
  colonne: Colonne,
  croissant: boolean,
): number {
  const signe = croissant ? 1 : -1;
  switch (colonne) {
    case "titre":
      return a.titre.localeCompare(b.titre) * signe;
    case "mesureTitre":
      return (a.mesureTitre ?? "").localeCompare(b.mesureTitre ?? "") * signe;
  }
}

const EnTeteColonne = ({
  colonne,
  tri,
  onClick,
}: {
  colonne: { cle: Colonne; libelle: string; largeur: number };
  tri: { colonne: Colonne; croissant: boolean };
  onClick: (colonne: Colonne) => void;
}) => (
  <div style={{ width: colonne.largeur }} className="shrink-0 px-4 py-2">
    <button
      type="button"
      onClick={() => onClick(colonne.cle)}
      className="flex cursor-pointer items-center gap-1 font-medium hover:text-neutral-900"
    >
      {colonne.libelle}
      <span className="text-xs text-neutral-400">
        {tri.colonne === colonne.cle ? (tri.croissant ? "▲" : "▼") : "↕"}
      </span>
    </button>
  </div>
);

export const VueCalendrierActions = ({ actions }: { actions: ActionCalendrier[] }) => {
  const [tri, setTri] = useState<{ colonne: Colonne; croissant: boolean }>({
    colonne: "titre",
    croissant: true,
  });
  const [indexGranularite, setIndexGranularite] = useState(0);
  const granularite = GRANULARITES[indexGranularite];
  const largeurColonne = LARGEUR_COLONNE[granularite];

  const zoomAvant = () =>
    setIndexGranularite((actuel) => Math.max(actuel - 1, 0));
  const zoomArriere = () =>
    setIndexGranularite((actuel) => Math.min(actuel + 1, GRANULARITES.length - 1));

  const basculerTri = (colonne: Colonne) => {
    setTri((triActuel) =>
      triActuel.colonne === colonne
        ? { colonne, croissant: !triActuel.croissant }
        : { colonne, croissant: true },
    );
  };

  const actionsAvecDates = actions.filter(
    (action) => action.datePrevisionnelleDebut && action.datePrevisionnelleFin,
  );
  const nombreActionsSansDates = actions.length - actionsAvecDates.length;

  if (actionsAvecDates.length === 0) {
    return (
      <p className="mt-6 text-sm text-neutral-500">
        Aucune action avec des dates prévisionnelles pour le moment.
      </p>
    );
  }

  const clésMoisDébut = actionsAvecDates.map((action) =>
    cléMois(new Date(action.datePrevisionnelleDebut as Date)),
  );
  const clésMoisFin = actionsAvecDates.map((action) =>
    cléMois(new Date(action.datePrevisionnelleFin as Date)),
  );
  const cléMoisMin = Math.min(...clésMoisDébut);
  const cléMoisMax = Math.max(...clésMoisFin);
  const cléMin = cléPeriode(cléMoisMin, granularite);
  const cléMax = cléPeriode(cléMoisMax, granularite);
  const nombreColonnes = cléMax - cléMin + 1;
  const largeurZone = nombreColonnes * largeurColonne;
  const largeurLabel = COLONNES.reduce((total, colonne) => total + colonne.largeur, 0);

  const actionsTriées = [...actionsAvecDates].sort((a, b) =>
    comparerActions(a, b, tri.colonne, tri.croissant),
  );

  const prioritésPrésentes = ORDRE_MESURE_PRIORITAIRE.filter((valeur) =>
    actionsAvecDates.some((action) => action.mesurePrioritaire === valeur),
  );

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-end gap-2 text-xs text-neutral-500">
        <span>{LIBELLES_GRANULARITE[granularite]}</span>
        <button
          type="button"
          onClick={zoomArriere}
          disabled={indexGranularite === GRANULARITES.length - 1}
          title="Zoom arrière (vue plus large : mois → trimestre → année)"
          aria-label="Zoom arrière"
          className="cursor-pointer rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100 disabled:cursor-default disabled:opacity-40"
        >
          🔍−
        </button>
        <button
          type="button"
          onClick={zoomAvant}
          disabled={indexGranularite === 0}
          title="Zoom avant (vue plus détaillée : année → trimestre → mois)"
          aria-label="Zoom avant"
          className="cursor-pointer rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100 disabled:cursor-default disabled:opacity-40"
        >
          🔍+
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <div style={{ width: largeurLabel + largeurZone }}>
          <div className="flex border-b border-neutral-200 bg-neutral-100 text-xs font-medium text-neutral-600">
            {COLONNES.map((colonne) => (
              <EnTeteColonne
                key={colonne.cle}
                colonne={colonne}
                tri={tri}
                onClick={basculerTri}
              />
            ))}
            <div style={{ width: largeurZone }} className="flex shrink-0">
              {Array.from({ length: nombreColonnes }).map((_, index) => (
                <div
                  key={index}
                  style={{ width: largeurColonne }}
                  className="shrink-0 border-l border-neutral-200 px-1 py-2 text-center"
                >
                  {libellePeriode(cléMin + index, granularite)}
                </div>
              ))}
            </div>
          </div>

          {actionsTriées.map((action) => {
            const début =
              cléPeriode(
                cléMois(new Date(action.datePrevisionnelleDebut as Date)),
                granularite,
              ) - cléMin;
            const fin =
              cléPeriode(
                cléMois(new Date(action.datePrevisionnelleFin as Date)),
                granularite,
              ) - cléMin;
            const largeurBarre = (fin - début + 1) * largeurColonne;
            const libellePrioritaire =
              LIBELLES_MESURE_PRIORITAIRE[action.mesurePrioritaire];
            const info = `${action.titre} — ${libellePrioritaire} : ${new Date(
              action.datePrevisionnelleDebut as Date,
            ).toLocaleDateString("fr-FR")} → ${new Date(
              action.datePrevisionnelleFin as Date,
            ).toLocaleDateString("fr-FR")}${action.bloquee ? " (bloquée)" : ""}`;

            return (
              <div
                key={action.id}
                className="flex items-center border-b border-neutral-100 text-sm"
              >
                <div
                  style={{ width: COLONNES[0].largeur }}
                  className="flex shrink-0 items-center gap-1 overflow-visible px-4 py-2 text-neutral-800"
                  title={action.titre}
                >
                  {action.bloquee ? (
                    <BoutonInfoBlocage action={action} icone="⛔" />
                  ) : null}
                  <span className="min-w-0 truncate">{action.titre}</span>
                </div>
                <div
                  style={{ width: COLONNES[1].largeur }}
                  className="shrink-0 truncate px-4 py-2 text-neutral-600"
                  title={action.mesureTitre}
                >
                  {action.mesureTitre ?? "—"}
                </div>
                <div
                  style={{ width: largeurZone, height: 40 }}
                  className="relative shrink-0"
                >
                  <div
                    title={info}
                    className={`absolute top-1/2 h-5 -translate-y-1/2 rounded ${COULEURS_MESURE_PRIORITAIRE[action.mesurePrioritaire]}`}
                    style={{
                      left: début * largeurColonne + 4,
                      width: Math.max(largeurBarre - 8, 8),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-100 px-4 py-2 text-xs text-neutral-500">
          {prioritésPrésentes.map((valeur) => (
            <span key={valeur} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-sm ${COULEURS_MESURE_PRIORITAIRE[valeur]}`}
              />
              {LIBELLES_MESURE_PRIORITAIRE[valeur]}
            </span>
          ))}
        </div>

        {nombreActionsSansDates > 0 ? (
          <p className="border-t border-neutral-100 px-4 py-2 text-xs text-neutral-400">
            {nombreActionsSansDates} action
            {nombreActionsSansDates > 1 ? "s" : ""} sans dates prévisionnelles non
            affichée{nombreActionsSansDates > 1 ? "s" : ""}.
          </p>
        ) : null}
      </div>
    </div>
  );
};
