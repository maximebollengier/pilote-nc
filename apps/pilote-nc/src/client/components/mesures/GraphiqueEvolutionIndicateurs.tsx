import * as echarts from "echarts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/client/utils/trpc";

type PointHistorique = {
  annee: number;
  trimestre: number;
  tauxRealisation: number | null;
};

const ChargeurHistoriqueIndicateur = ({
  indicateurId,
  onDonnees,
}: {
  indicateurId: string;
  onDonnees: (indicateurId: string, points: PointHistorique[]) => void;
}) => {
  const { data } =
    trpc.propositionValeurAvancement.listerHistoriqueParIndicateur.useQuery({
      indicateurId,
    });

  useEffect(() => {
    if (data) onDonnees(indicateurId, data.points);
  }, [data, indicateurId, onDonnees]);

  return null;
};

const cléPeriode = (annee: number, trimestre: number) => annee * 10 + trimestre;

export const GraphiqueEvolutionIndicateurs = ({
  indicateurs,
}: {
  indicateurs: { id: string; nom: string }[];
}) => {
  const [historiques, setHistoriques] = useState<Record<string, PointHistorique[]>>(
    {},
  );
  const definirHistorique = useCallback(
    (indicateurId: string, points: PointHistorique[]) => {
      setHistoriques((precedent) => ({ ...precedent, [indicateurId]: points }));
    },
    [],
  );

  const conteneurRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  const periodes = useMemo(() => {
    const clésVues = new Map<number, { annee: number; trimestre: number }>();
    for (const points of Object.values(historiques)) {
      for (const point of points) {
        clésVues.set(cléPeriode(point.annee, point.trimestre), point);
      }
    }
    return [...clésVues.values()].sort(
      (a, b) => cléPeriode(a.annee, a.trimestre) - cléPeriode(b.annee, b.trimestre),
    );
  }, [historiques]);

  const series = useMemo(
    () =>
      indicateurs
        .map((indicateur) => {
          const points = historiques[indicateur.id] ?? [];
          const valeursParPeriode = new Map(
            points.map((point) => [
              cléPeriode(point.annee, point.trimestre),
              point.tauxRealisation,
            ]),
          );
          return {
            nom: indicateur.nom,
            aDesDonnees: points.length > 0,
            valeurs: periodes.map(
              (periode) =>
                valeursParPeriode.get(cléPeriode(periode.annee, periode.trimestre)) ??
                null,
            ),
          };
        })
        .filter((serie) => serie.aDesDonnees),
    [indicateurs, historiques, periodes],
  );

  useEffect(() => {
    if (!conteneurRef.current) return;
    if (!chartRef.current) chartRef.current = echarts.init(conteneurRef.current);

    chartRef.current.setOption({
      color: ["#1e3a5f", "#2f9e44", "#e8590c", "#5f3dc4", "#0c8599", "#c2255c"],
      grid: { left: 48, right: 24, top: 48, bottom: 32 },
      tooltip: {
        trigger: "axis",
        valueFormatter: (valeur: unknown) => `${valeur}%`,
      },
      legend: { top: 0 },
      xAxis: {
        type: "category",
        data: periodes.map((periode) => `T${periode.trimestre} ${periode.annee}`),
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        name: "Taux de réalisation",
        axisLabel: { formatter: "{value}%" },
      },
      series: series.map((serie) => ({
        name: serie.nom,
        type: "line",
        data: serie.valeurs,
        connectNulls: true,
        symbolSize: 7,
      })),
    });

    const onResize = () => chartRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [periodes, series]);

  useEffect(() => () => chartRef.current?.dispose(), []);

  return (
    <div>
      {indicateurs.map((indicateur) => (
        <ChargeurHistoriqueIndicateur
          key={indicateur.id}
          indicateurId={indicateur.id}
          onDonnees={definirHistorique}
        />
      ))}
      {series.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          Aucune valeur validée pour le moment : le graphique apparaîtra dès
          qu'une proposition de valeur d'avancement aura été validée.
        </p>
      ) : (
        <div ref={conteneurRef} className="h-80 w-full" />
      )}
    </div>
  );
};
