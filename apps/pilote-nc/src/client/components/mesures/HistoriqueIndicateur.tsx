import * as echarts from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/client/utils/trpc";

const VUES = [
  { id: "tableau", libelle: "Tableau" },
  { id: "graphique", libelle: "Graphique" },
] as const;
type Vue = (typeof VUES)[number]["id"];

type PointHistorique = {
  pvaId: string;
  annee: number;
  trimestre: number;
  valeur: number;
  tauxRealisation: number | null;
  commentaireSg: string | null;
};

type Colonne = "periode" | "valeur" | "tauxRealisation" | "commentaireSg";

const COLONNES: { cle: Colonne; libelle: string }[] = [
  { cle: "periode", libelle: "Trimestre" },
  { cle: "valeur", libelle: "Valeur constatée" },
  { cle: "tauxRealisation", libelle: "Taux de réalisation" },
  { cle: "commentaireSg", libelle: "Commentaire" },
];

const cléPeriode = (point: PointHistorique) => point.annee * 10 + point.trimestre;

function comparerPoints(
  a: PointHistorique,
  b: PointHistorique,
  colonne: Colonne,
  croissant: boolean,
): number {
  const signe = croissant ? 1 : -1;
  switch (colonne) {
    case "periode":
      return (cléPeriode(a) - cléPeriode(b)) * signe;
    case "valeur":
      return (a.valeur - b.valeur) * signe;
    case "tauxRealisation": {
      if (a.tauxRealisation === null && b.tauxRealisation === null) return 0;
      if (a.tauxRealisation === null) return 1;
      if (b.tauxRealisation === null) return -1;
      return (a.tauxRealisation - b.tauxRealisation) * signe;
    }
    case "commentaireSg":
      return (a.commentaireSg ?? "").localeCompare(b.commentaireSg ?? "") * signe;
  }
}

const GraphiqueValeurIndicateur = ({
  points,
  unite,
}: {
  points: { annee: number; trimestre: number; valeur: number }[];
  unite: string | null;
}) => {
  const conteneurRef = useRef<HTMLDivElement | null>(null);

  // Un seul effet couvrant création + configuration + nettoyage : chaque
  // montage crée sa propre instance et la dispose lui-même. La scinder en
  // deux effets (l'un créant/configurant, l'autre ne faisant que disposer
  // via une ref partagée) casse sous le double-montage de React 18 Strict
  // Mode en dev — le second passage dispose l'instance créée par le
  // premier, puis réutilise la ref (non nulle mais désormais invalide) au
  // lieu d'en recréer une, laissant le graphique vide.
  useEffect(() => {
    if (!conteneurRef.current) return;
    const chart = echarts.init(conteneurRef.current);

    chart.setOption({
      color: ["#1e3a5f"],
      grid: { left: 48, right: 24, top: 24, bottom: 32 },
      tooltip: {
        trigger: "axis",
        valueFormatter: (valeur: unknown) => `${valeur}${unite ?? ""}`,
      },
      xAxis: {
        type: "category",
        data: points.map((point) => `T${point.trimestre} ${point.annee}`),
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: `{value}${unite ?? ""}` },
      },
      series: [
        {
          type: "line",
          data: points.map((point) => point.valeur),
          symbolSize: 7,
        },
      ],
    });

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [points, unite]);

  return <div ref={conteneurRef} className="h-56 w-full" />;
};

const LigneHistorique = ({
  point,
  unite,
  peutModifier,
  onChanged,
}: {
  point: PointHistorique;
  unite: string | null;
  peutModifier: boolean;
  onChanged: () => void;
}) => {
  const modifier = trpc.propositionValeurAvancement.modifierValeurValidee.useMutation(
    { onSuccess: onChanged },
  );
  const [enEdition, setEnEdition] = useState(false);
  const [valeur, setValeur] = useState(String(point.valeur));
  const [commentaire, setCommentaire] = useState(point.commentaireSg ?? "");

  const annuler = () => {
    setValeur(String(point.valeur));
    setCommentaire(point.commentaireSg ?? "");
    setEnEdition(false);
  };

  if (enEdition) {
    return (
      <tr className="border-t border-neutral-100 align-top">
        <td className="px-4 py-2">
          T{point.trimestre} {point.annee}
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={valeur}
            onChange={(event) => setValeur(event.target.value)}
            className="w-24 rounded border border-neutral-300 px-2 py-1"
          />
        </td>
        <td className="px-4 py-2 text-neutral-400">
          {point.tauxRealisation === null
            ? "—"
            : `${Math.round(point.tauxRealisation)}%`}
        </td>
        <td className="px-4 py-2">
          <textarea
            value={commentaire}
            onChange={(event) => setCommentaire(event.target.value)}
            rows={2}
            className="w-full rounded border border-neutral-300 px-2 py-1"
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={modifier.isPending || valeur === ""}
              onClick={() =>
                modifier.mutate(
                  {
                    pvaId: point.pvaId,
                    valeurValidee: Number(valeur),
                    commentaireSg: commentaire.trim() || null,
                  },
                  { onSuccess: () => setEnEdition(false) },
                )
              }
              className="cursor-pointer rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary-hover disabled:opacity-50"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={annuler}
              className="cursor-pointer rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
            >
              Annuler
            </button>
          </div>
          {modifier.error ? (
            <p className="mt-1 text-xs text-error">{modifier.error.message}</p>
          ) : null}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-neutral-100">
      <td className="px-4 py-2">
        T{point.trimestre} {point.annee}
      </td>
      <td className="px-4 py-2">
        {point.valeur}
        {unite ?? ""}
      </td>
      <td className="px-4 py-2">
        {point.tauxRealisation === null
          ? "—"
          : `${Math.round(point.tauxRealisation)}%`}
      </td>
      <td className="px-4 py-2 text-neutral-600">{point.commentaireSg ?? "—"}</td>
      <td className="px-4 py-2">
        {peutModifier ? (
          <button
            type="button"
            onClick={() => setEnEdition(true)}
            aria-label="Modifier"
            title="Modifier"
            className="cursor-pointer rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✏️
          </button>
        ) : null}
      </td>
    </tr>
  );
};

export const HistoriqueIndicateur = ({
  indicateurId,
  unite,
  peutModifier = false,
}: {
  indicateurId: string;
  unite: string | null;
  peutModifier?: boolean;
}) => {
  const utils = trpc.useContext();
  const [vue, setVue] = useState<Vue>("tableau");
  const [tri, setTri] = useState<{ colonne: Colonne; croissant: boolean }>({
    colonne: "periode",
    croissant: true,
  });
  const { data } =
    trpc.propositionValeurAvancement.listerHistoriqueParIndicateur.useQuery({
      indicateurId,
    });

  const invalider = () => {
    utils.propositionValeurAvancement.listerHistoriqueParIndicateur.invalidate({
      indicateurId,
    });
    utils.indicateursImpact.listerParMesure.invalidate();
    utils.mesures.recuperer.invalidate();
    utils.mesures.lister.invalidate();
  };

  const basculerTri = (colonne: Colonne) => {
    setTri((triActuel) =>
      triActuel.colonne === colonne
        ? { colonne, croissant: !triActuel.croissant }
        : { colonne, croissant: true },
    );
  };

  const pointsChronologiques = useMemo(
    () => [...(data?.points ?? [])].sort((a, b) => cléPeriode(a) - cléPeriode(b)),
    [data],
  );

  const pointsTriés = useMemo(
    () =>
      [...pointsChronologiques].sort((a, b) =>
        comparerPoints(a, b, tri.colonne, tri.croissant),
      ),
    [pointsChronologiques, tri],
  );

  return (
    <div className="mt-3">
      <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
        {VUES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setVue(option.id)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              vue === option.id
                ? "bg-primary text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {option.libelle}
          </button>
        ))}
      </div>

      {pointsChronologiques.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          Aucune valeur validée pour le moment.
        </p>
      ) : vue === "tableau" ? (
        <table className="mt-3 w-full border-collapse text-sm">
          <thead className="text-left text-neutral-600">
            <tr>
              {COLONNES.map((colonne) => (
                <th key={colonne.cle} className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => basculerTri(colonne.cle)}
                    className="flex cursor-pointer items-center gap-1 font-medium hover:text-neutral-900"
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
            {pointsTriés.map((point) => (
              <LigneHistorique
                key={point.pvaId}
                point={point}
                unite={unite}
                peutModifier={peutModifier}
                onChanged={invalider}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <GraphiqueValeurIndicateur points={pointsChronologiques} unite={unite} />
      )}
    </div>
  );
};
