import Head from "next/head";
import Link from "next/link";
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
import {
  LIBELLES_MESURE_PRIORITAIRE,
  MesurePrioritaire,
  ORDRE_MESURE_PRIORITAIRE,
} from "@/server/mesures/domain/MesurePrioritaire";
import {
  LIBELLES_PHASE_MESURE,
  ORDRE_PHASE_MESURE,
  PhaseMesure,
} from "@/server/mesures/domain/PhaseMesure";
import { VueKanban } from "@/client/components/mesures/VueKanban";
import { VueKanbanParPhase } from "@/client/components/mesures/VueKanbanParPhase";
import { MesureAffichage } from "@/client/types/mesure";
import { Modal } from "@/client/components/Modal";

const PROFILS_AUTORISES = ["ADMIN_OUTIL", "PRESIDENT"] as const;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);
  if (!session) {
    return { redirect: { destination: "/connexion", permanent: false } };
  }
  if (!(PROFILS_AUTORISES as readonly string[]).includes(session.profil)) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
};

type Mesure = {
  id: string;
  code: string;
  titre: string;
  secteurId: string;
  coPorteurIds: string[];
  statut: keyof typeof LIBELLES_STATUT_MESURE;
  mesurePrioritaire: MesurePrioritaire;
  phase: PhaseMesure;
  meteoAvancement: number | null;
  tauxAvancementIndicateurs: number | null;
};
type Secteur = {
  id: string;
  code: string;
  nom: string;
  accordGouvernance: boolean;
};

type Colonne = "code" | "titre" | "porteur" | "coPorteurs" | "statut" | "phase";

const COLONNES: { cle: Colonne; libelle: string }[] = [
  { cle: "code", libelle: "Code" },
  { cle: "titre", libelle: "Titre" },
  { cle: "porteur", libelle: "Porteur" },
  { cle: "coPorteurs", libelle: "Co-porteurs" },
  { cle: "statut", libelle: "Statut" },
  { cle: "phase", libelle: "Phase" },
];

function nomSecteur(id: string, secteurs: Secteur[] | undefined): string {
  return secteurs?.find((secteur) => secteur.id === id)?.nom ?? "";
}

function nomsCoPorteurs(mesure: Mesure, secteurs: Secteur[] | undefined): string {
  return mesure.coPorteurIds
    .map((id) => nomSecteur(id, secteurs))
    .filter(Boolean)
    .join(", ");
}

function comparerMesures(
  a: Mesure,
  b: Mesure,
  colonne: Colonne,
  croissant: boolean,
  secteurs: Secteur[] | undefined,
): number {
  const signe = croissant ? 1 : -1;
  switch (colonne) {
    case "code":
      return a.code.localeCompare(b.code) * signe;
    case "titre":
      return a.titre.localeCompare(b.titre) * signe;
    case "porteur":
      return (
        nomSecteur(a.secteurId, secteurs).localeCompare(
          nomSecteur(b.secteurId, secteurs),
        ) * signe
      );
    case "coPorteurs":
      return (
        nomsCoPorteurs(a, secteurs).localeCompare(nomsCoPorteurs(b, secteurs)) *
        signe
      );
    case "statut":
      return (
        (ORDRE_STATUT_MESURE.indexOf(a.statut) -
          ORDRE_STATUT_MESURE.indexOf(b.statut)) *
        signe
      );
    case "phase":
      return (
        (ORDRE_PHASE_MESURE.indexOf(a.phase) - ORDRE_PHASE_MESURE.indexOf(b.phase)) *
        signe
      );
  }
}

const SelecteurStatutInline = ({
  mesureId,
  statutActuel,
}: {
  mesureId: string;
  statutActuel: StatutMesure;
}) => {
  const utils = trpc.useContext();
  const modifierStatut = trpc.mesures.modifierStatut.useMutation({
    onSuccess: () => utils.mesures.lister.invalidate(),
  });

  return (
    <div>
      <select
        value={statutActuel}
        onChange={(event) =>
          modifierStatut.mutate({
            id: mesureId,
            statut: event.target.value as StatutMesure,
          })
        }
        disabled={modifierStatut.isPending}
        className="rounded border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50"
      >
        {ORDRE_STATUT_MESURE.map((statut) => (
          <option key={statut} value={statut}>
            {LIBELLES_STATUT_MESURE[statut]}
          </option>
        ))}
      </select>
      {modifierStatut.error ? (
        <p className="mt-1 text-xs text-error">{modifierStatut.error.message}</p>
      ) : null}
    </div>
  );
};

const SelecteurPhaseInline = ({
  mesureId,
  phaseActuelle,
}: {
  mesureId: string;
  phaseActuelle: PhaseMesure;
}) => {
  const utils = trpc.useContext();
  const modifierPhase = trpc.mesures.modifierPhase.useMutation({
    onSuccess: () => utils.mesures.lister.invalidate(),
  });

  return (
    <div>
      <select
        value={phaseActuelle}
        onChange={(event) =>
          modifierPhase.mutate({
            id: mesureId,
            phase: event.target.value as PhaseMesure,
          })
        }
        disabled={modifierPhase.isPending}
        className="rounded border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50"
      >
        {ORDRE_PHASE_MESURE.map((phase) => (
          <option key={phase} value={phase}>
            {LIBELLES_PHASE_MESURE[phase]}
          </option>
        ))}
      </select>
      {modifierPhase.error ? (
        <p className="mt-1 text-xs text-error">{modifierPhase.error.message}</p>
      ) : null}
    </div>
  );
};

const LigneMesure = ({
  mesure,
  secteurs,
  peutModifier,
}: {
  mesure: Mesure;
  secteurs: Secteur[] | undefined;
  peutModifier: boolean;
}) => {
  const utils = trpc.useContext();
  const modifier = trpc.mesures.modifier.useMutation({
    onSuccess: () => utils.mesures.lister.invalidate(),
  });

  const [enEdition, setEnEdition] = useState(false);
  const [code, setCode] = useState(mesure.code);
  const [titre, setTitre] = useState(mesure.titre);
  const [secteurId, setSecteurId] = useState(mesure.secteurId);
  const [coPorteurIds, setCoPorteurIds] = useState<string[]>(mesure.coPorteurIds);
  const [mesurePrioritaire, setMesurePrioritaire] = useState<MesurePrioritaire>(
    mesure.mesurePrioritaire,
  );

  const basculerCoPorteur = (id: string) => {
    setCoPorteurIds((actuel) =>
      actuel.includes(id)
        ? actuel.filter((coPorteurId) => coPorteurId !== id)
        : [...actuel, id],
    );
  };

  const annuler = () => {
    setCode(mesure.code);
    setTitre(mesure.titre);
    setSecteurId(mesure.secteurId);
    setCoPorteurIds(mesure.coPorteurIds);
    setMesurePrioritaire(mesure.mesurePrioritaire);
    setEnEdition(false);
  };

  if (enEdition && peutModifier) {
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
            value={titre}
            onChange={(event) => setTitre(event.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1"
          />
        </td>
        <td className="px-4 py-2">
          <select
            value={secteurId}
            onChange={(event) => {
              setSecteurId(event.target.value);
              setCoPorteurIds((actuel) =>
                actuel.filter((coPorteurId) => coPorteurId !== event.target.value),
              );
            }}
            className="w-full rounded border border-neutral-300 px-2 py-1"
          >
            {secteurs?.map((secteur) => (
              <option key={secteur.id} value={secteur.id}>
                {secteur.nom}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {secteurs
              ?.filter((secteur) => secteur.id !== secteurId)
              .map((secteur) => (
                <label
                  key={secteur.id}
                  className="flex items-center gap-1 rounded border border-neutral-300 px-2 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={coPorteurIds.includes(secteur.id)}
                    onChange={() => basculerCoPorteur(secteur.id)}
                  />
                  {secteur.nom}
                </label>
              ))}
          </div>
        </td>
        <td className="px-4 py-2">
          <select
            value={mesurePrioritaire}
            onChange={(event) =>
              setMesurePrioritaire(event.target.value as MesurePrioritaire)
            }
            className="w-full rounded border border-neutral-300 px-2 py-1"
          >
            {ORDRE_MESURE_PRIORITAIRE.map((valeur) => (
              <option key={valeur} value={valeur}>
                {LIBELLES_MESURE_PRIORITAIRE[valeur]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2">
          <SelecteurStatutInline mesureId={mesure.id} statutActuel={mesure.statut} />
        </td>
        <td className="px-4 py-2">
          <SelecteurPhaseInline mesureId={mesure.id} phaseActuelle={mesure.phase} />
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={modifier.isPending}
              onClick={() =>
                modifier.mutate(
                  {
                    id: mesure.id,
                    code,
                    titre,
                    secteurId,
                    coPorteurIds,
                    mesurePrioritaire,
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
              onClick={annuler}
              className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
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
      <td className="px-4 py-2">{mesure.code}</td>
      <td className="px-4 py-2">
        <Link href={`/mesure/${mesure.id}`} className="text-primary hover:underline">
          {mesure.titre}
        </Link>
      </td>
      <td className="px-4 py-2">
        {secteurs?.find((secteur) => secteur.id === mesure.secteurId)?.nom}
      </td>
      <td className="px-4 py-2">
        {mesure.coPorteurIds
          .map((id) => secteurs?.find((secteur) => secteur.id === id)?.nom)
          .filter(Boolean)
          .join(", ")}
      </td>
      <td className="px-4 py-2">
        {LIBELLES_MESURE_PRIORITAIRE[mesure.mesurePrioritaire]}
      </td>
      <td className="px-4 py-2">
        {peutModifier ? (
          <SelecteurStatutInline mesureId={mesure.id} statutActuel={mesure.statut} />
        ) : (
          LIBELLES_STATUT_MESURE[mesure.statut]
        )}
      </td>
      <td className="px-4 py-2">
        {peutModifier ? (
          <SelecteurPhaseInline mesureId={mesure.id} phaseActuelle={mesure.phase} />
        ) : (
          LIBELLES_PHASE_MESURE[mesure.phase]
        )}
      </td>
      <td className="px-4 py-2">
        {peutModifier ? (
          <button
            type="button"
            onClick={() => setEnEdition(true)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
          >
            Modifier
          </button>
        ) : null}
      </td>
    </tr>
  );
};

const EnTeteColonne = ({
  colonne,
  tri,
  onClick,
}: {
  colonne: { cle: Colonne; libelle: string };
  tri: { colonne: Colonne; croissant: boolean };
  onClick: (colonne: Colonne) => void;
}) => (
  <th className="px-4 py-2">
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
  </th>
);

const VUES = [
  { id: "tableau", libelle: "Tableau" },
  { id: "kanban", libelle: "Kanban" },
  { id: "kanban-phase", libelle: "Kanban (Phases)" },
] as const;
type Vue = (typeof VUES)[number]["id"];

const FILTRES_ACCORD_GOUVERNANCE = [
  { id: "tous", libelle: "Accord de gouvernance : tous" },
  { id: "oui", libelle: "Accord de gouvernance : Oui" },
  { id: "non", libelle: "Accord de gouvernance : Non" },
] as const;
type FiltreAccordGouvernance = (typeof FILTRES_ACCORD_GOUVERNANCE)[number]["id"];

const PageMesures = () => {
  const utils = trpc.useContext();
  const { data: mesures } = trpc.mesures.lister.useQuery();
  const { data: secteurs } = trpc.secteurs.lister.useQuery();
  const { data: utilisateur } =
    trpc.profilUtilisateur.getUtilisateurConnecte.useQuery();
  const peutGerer =
    utilisateur?.profil === "ADMIN_OUTIL" || utilisateur?.profil === "PRESIDENT";
  const [vue, setVue] = useState<Vue>("tableau");
  const [modaleCreationOuverte, setModaleCreationOuverte] = useState(false);
  const [filtreAccordGouvernance, setFiltreAccordGouvernance] =
    useState<FiltreAccordGouvernance>("tous");
  const [tri, setTri] = useState<{ colonne: Colonne; croissant: boolean }>({
    colonne: "code",
    croissant: true,
  });

  const basculerTri = (colonne: Colonne) => {
    setTri((triActuel) =>
      triActuel.colonne === colonne
        ? { colonne, croissant: !triActuel.croissant }
        : { colonne, croissant: true },
    );
  };
  const creer = trpc.mesures.creer.useMutation({
    onSuccess: () => utils.mesures.lister.invalidate(),
  });

  const [code, setCode] = useState("");
  const [titre, setTitre] = useState("");
  const [secteurId, setSecteurId] = useState("");
  const [coPorteurIds, setCoPorteurIds] = useState<string[]>([]);
  const [mesurePrioritaire, setMesurePrioritaire] = useState<MesurePrioritaire | "">(
    "",
  );
  const [phase, setPhase] = useState<PhaseMesure>(PhaseMesure.AN_1);

  const basculerCoPorteur = (id: string) => {
    setCoPorteurIds((actuel) =>
      actuel.includes(id)
        ? actuel.filter((coPorteurId) => coPorteurId !== id)
        : [...actuel, id],
    );
  };

  const soumettre = (event: FormEvent) => {
    event.preventDefault();
    if (!secteurId || !mesurePrioritaire) return;
    creer.mutate(
      {
        code,
        titre,
        description: null,
        secteurId,
        coPorteurIds,
        mesurePrioritaire,
        phase,
      },
      {
        onSuccess: () => {
          setCode("");
          setTitre("");
          setSecteurId("");
          setCoPorteurIds([]);
          setMesurePrioritaire("");
          setPhase(PhaseMesure.AN_1);
          setModaleCreationOuverte(false);
        },
      },
    );
  };

  const mesuresFiltrees = useMemo(() => {
    const toutes = mesures as Mesure[] | undefined;
    if (!toutes) return toutes;
    if (filtreAccordGouvernance === "tous") return toutes;
    return toutes.filter((mesure) => {
      const accordGouvernance = secteurs?.find(
        (secteur) => secteur.id === mesure.secteurId,
      )?.accordGouvernance;
      return filtreAccordGouvernance === "oui"
        ? accordGouvernance === true
        : !accordGouvernance;
    });
  }, [mesures, secteurs, filtreAccordGouvernance]);

  const mesuresTriees = useMemo(
    () =>
      mesuresFiltrees
        ?.slice()
        .sort((a, b) => comparerMesures(a, b, tri.colonne, tri.croissant, secteurs)),
    [mesuresFiltrees, tri, secteurs],
  );

  const mesuresParPrioritaire = mesuresTriees?.reduce<Record<string, Mesure[]>>(
    (groupes, mesure) => {
      (groupes[mesure.mesurePrioritaire] ??= []).push(mesure);
      return groupes;
    },
    {},
  );

  return (
    <Layout>
      <Head>
        <title>Mesures - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-800">Mesures</h1>
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
              Ajouter une mesure
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={filtreAccordGouvernance}
          onChange={(event) =>
            setFiltreAccordGouvernance(event.target.value as FiltreAccordGouvernance)
          }
          className="w-full max-w-xs rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          {FILTRES_ACCORD_GOUVERNANCE.map((option) => (
            <option key={option.id} value={option.id}>
              {option.libelle}
            </option>
          ))}
        </select>
      </div>

      <Modal
        open={modaleCreationOuverte}
        titre="Ajouter une mesure"
        onFermer={() => setModaleCreationOuverte(false)}
      >
        <form onSubmit={soumettre} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="rounded border border-neutral-300 px-3 py-2"
              placeholder="MES-XXX"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Titre
            <input
              value={titre}
              onChange={(event) => setTitre(event.target.value)}
              className="rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Porteur
            <select
              value={secteurId}
              onChange={(event) => {
                setSecteurId(event.target.value);
                setCoPorteurIds((actuel) =>
                  actuel.filter((coPorteurId) => coPorteurId !== event.target.value),
                );
              }}
              className="rounded border border-neutral-300 px-3 py-2"
            >
              <option value="">— choisir —</option>
              {secteurs?.map((secteur) => (
                <option key={secteur.id} value={secteur.id}>
                  {secteur.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Co-porteurs
            <div className="flex flex-wrap gap-2 py-2">
              {secteurs
                ?.filter((secteur) => secteur.id !== secteurId)
                .map((secteur) => (
                  <label
                    key={secteur.id}
                    className="flex items-center gap-1 rounded border border-neutral-300 px-2 py-1 text-xs font-normal"
                  >
                    <input
                      type="checkbox"
                      checked={coPorteurIds.includes(secteur.id)}
                      onChange={() => basculerCoPorteur(secteur.id)}
                    />
                    {secteur.nom}
                  </label>
                ))}
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Mesure prioritaire
            <select
              value={mesurePrioritaire}
              onChange={(event) =>
                setMesurePrioritaire(event.target.value as MesurePrioritaire)
              }
              className="rounded border border-neutral-300 px-3 py-2"
            >
              <option value="">— choisir —</option>
              {ORDRE_MESURE_PRIORITAIRE.map((valeur) => (
                <option key={valeur} value={valeur}>
                  {LIBELLES_MESURE_PRIORITAIRE[valeur]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Phase
            <select
              value={phase}
              onChange={(event) => setPhase(event.target.value as PhaseMesure)}
              className="rounded border border-neutral-300 px-3 py-2"
            >
              {ORDRE_PHASE_MESURE.map((valeur) => (
                <option key={valeur} value={valeur}>
                  {LIBELLES_PHASE_MESURE[valeur]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={creer.isPending || !secteurId || !mesurePrioritaire}
            className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Créer
          </button>
          {creer.error ? (
            <p className="text-sm text-error">{creer.error.message}</p>
          ) : null}
        </form>
      </Modal>

      {vue === "tableau" ? (
        <div className="mt-6 flex flex-col gap-6">
          {ORDRE_MESURE_PRIORITAIRE.map((valeur) => {
            const mesuresDuGroupe = mesuresParPrioritaire?.[valeur];
            if (!mesuresDuGroupe || mesuresDuGroupe.length === 0) return null;

            return (
              <div key={valeur}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  {LIBELLES_MESURE_PRIORITAIRE[valeur]}
                </h2>
                <table className="w-full border-collapse overflow-hidden rounded-lg border border-neutral-200 bg-white text-sm">
                  <thead className="bg-neutral-100 text-left text-neutral-600">
                    <tr>
                      {COLONNES.slice(0, 4).map((colonne) => (
                        <EnTeteColonne
                          key={colonne.cle}
                          colonne={colonne}
                          tri={tri}
                          onClick={basculerTri}
                        />
                      ))}
                      <th className="px-4 py-2">Mesure prioritaire</th>
                      {COLONNES.slice(4).map((colonne) => (
                        <EnTeteColonne
                          key={colonne.cle}
                          colonne={colonne}
                          tri={tri}
                          onClick={basculerTri}
                        />
                      ))}
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesuresDuGroupe.map((mesure) => (
                      <LigneMesure
                        key={mesure.id}
                        mesure={mesure}
                        secteurs={secteurs}
                        peutModifier={peutGerer}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ) : null}

      {vue === "kanban" && mesuresFiltrees ? (
        <div className="mt-6">
          <VueKanban mesures={mesuresFiltrees as MesureAffichage[]} />
        </div>
      ) : null}

      {vue === "kanban-phase" && mesuresFiltrees ? (
        <div className="mt-6">
          <VueKanbanParPhase
            mesures={mesuresFiltrees as MesureAffichage[]}
            peutDeplacer={peutGerer}
          />
        </div>
      ) : null}
    </Layout>
  );
};

export default PageMesures;
