import Head from "next/head";
import { useMemo, useState } from "react";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { trpc } from "@/client/utils/trpc";
import { Layout } from "@/client/components/Layout";
import { VueListe } from "@/client/components/mesures/VueListe";
import { VueTableau } from "@/client/components/mesures/VueTableau";
import { VueKanban } from "@/client/components/mesures/VueKanban";
import { VueCalendrierActions } from "@/client/components/actions/VueCalendrierActions";
import { BlocEcheancesActions } from "@/client/components/actions/BlocEcheancesActions";
import {
  ModaleListeActions,
  SelectionActions,
} from "@/client/components/actions/ModaleListeActions";
import { Jauge } from "@/client/components/Jauge";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);

  if (!session) {
    return { redirect: { destination: "/connexion", permanent: false } };
  }

  return { props: {} };
};

const VUES = [
  { id: "liste", libelle: "Liste" },
  { id: "tableau", libelle: "Tableau" },
  { id: "kanban", libelle: "Kanban" },
  { id: "calendrier", libelle: "Calendrier" },
] as const;
type Vue = (typeof VUES)[number]["id"];

const FILTRES_ACTIONS = [
  { id: "toutes", libelle: "Toutes les actions" },
  { id: "bloquees", libelle: "Actions bloquées" },
] as const;
type FiltreActions = (typeof FILTRES_ACTIONS)[number]["id"];

const FILTRES_ACCORD_GOUVERNANCE = [
  { id: "tous", libelle: "Accord de gouvernance : tous" },
  { id: "oui", libelle: "Accord de gouvernance : Oui" },
  { id: "non", libelle: "Accord de gouvernance : Non" },
] as const;
type FiltreAccordGouvernance = (typeof FILTRES_ACCORD_GOUVERNANCE)[number]["id"];

const PageAccueil = () => {
  const { data: mesures, isLoading } = trpc.mesures.lister.useQuery();
  const { data: actions } = trpc.actions.lister.useQuery();
  const { data: secteurs } = trpc.secteurs.lister.useQuery();
  const { data: utilisateur } =
    trpc.profilUtilisateur.getUtilisateurConnecte.useQuery();
  const estPresident = utilisateur?.profil === "PRESIDENT";
  const [vue, setVue] = useState<Vue>("kanban");
  const [selectionActions, setSelectionActions] =
    useState<SelectionActions | null>(null);
  const [secteurId, setSecteurId] = useState("");
  const [filtreActions, setFiltreActions] = useState<FiltreActions>("toutes");
  const [filtreAccordGouvernance, setFiltreAccordGouvernance] =
    useState<FiltreAccordGouvernance>("tous");

  const idsMesuresAvecActionBloquee = useMemo(() => {
    if (!actions) return undefined;
    return new Set(
      actions.filter((action) => action.bloquee).map((action) => action.mesureId),
    );
  }, [actions]);

  const mesuresAffichees = useMemo(() => {
    if (!mesures) return mesures;

    const mesureesActees = mesures.filter((mesure) => mesure.statut === "ACTEE");
    const mesuresDuSecteur = secteurId
      ? mesureesActees.filter((mesure) => mesure.secteurId === secteurId)
      : mesureesActees;

    const mesuresFiltreesParAccord =
      filtreAccordGouvernance === "tous"
        ? mesuresDuSecteur
        : mesuresDuSecteur.filter((mesure) => {
            const accordGouvernance = secteurs?.find(
              (secteur) => secteur.id === mesure.secteurId,
            )?.accordGouvernance;
            return filtreAccordGouvernance === "oui"
              ? accordGouvernance === true
              : !accordGouvernance;
          });

    if (filtreActions === "bloquees") {
      if (!idsMesuresAvecActionBloquee) return undefined;
      return mesuresFiltreesParAccord.filter((mesure) =>
        idsMesuresAvecActionBloquee.has(mesure.id),
      );
    }

    return mesuresFiltreesParAccord;
  }, [
    mesures,
    secteurId,
    filtreActions,
    filtreAccordGouvernance,
    secteurs,
    idsMesuresAvecActionBloquee,
  ]);

  const actionsAffichees = useMemo(() => {
    if (!actions || !mesuresAffichees) return undefined;
    const idsMesuresAffichees = new Set(
      mesuresAffichees.map((mesure) => mesure.id),
    );
    return actions.filter((action) => idsMesuresAffichees.has(action.mesureId));
  }, [actions, mesuresAffichees]);

  // Pour le calendrier : contrairement aux blocs de synthèse (qui montrent
  // l'avancement de toutes les actions des mesures concernées), le filtre
  // "Actions bloquées" doit ici ne garder que les actions elles-mêmes
  // bloquées, pas toutes les actions de leur mesure.
  const actionsCalendrier = useMemo(() => {
    if (!actionsAffichees) return actionsAffichees;
    if (filtreActions !== "bloquees") return actionsAffichees;
    return actionsAffichees.filter((action) => action.bloquee);
  }, [actionsAffichees, filtreActions]);

  const avancementMoyenActions = useMemo(() => {
    if (!actionsAffichees || actionsAffichees.length === 0) return null;
    const somme = actionsAffichees.reduce(
      (total, action) => total + action.tauxAvancement,
      0,
    );
    return somme / actionsAffichees.length;
  }, [actionsAffichees]);

  const avancementMoyenIndicateurs = useMemo(() => {
    if (!mesuresAffichees) return null;
    const valeurs = mesuresAffichees
      .map((mesure) => mesure.tauxAvancementIndicateurs)
      .filter((valeur): valeur is number => valeur !== null);
    if (valeurs.length === 0) return null;
    return valeurs.reduce((total, valeur) => total + valeur, 0) / valeurs.length;
  }, [mesuresAffichees]);

  const nombreActionsBloquees =
    actionsAffichees?.filter((action) => action.bloquee).length ?? 0;

  const nombreActionsAffichees = actionsAffichees?.length ?? 0;
  const nombreIndicateursAffiches = useMemo(() => {
    if (!mesuresAffichees) return 0;
    return mesuresAffichees.reduce(
      (total, mesure) => total + mesure.nombreIndicateurs,
      0,
    );
  }, [mesuresAffichees]);

  return (
    <Layout>
      <Head>
        <title>PILOTE Nouvelle-Calédonie</title>
      </Head>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-800">
          Mesures du gouvernement
        </h1>
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
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={secteurId}
          onChange={(event) => setSecteurId(event.target.value)}
          className="w-full max-w-xs rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les secteurs</option>
          {secteurs?.map((secteur) => (
            <option key={secteur.id} value={secteur.id}>
              {secteur.nom}
            </option>
          ))}
        </select>
        <select
          value={filtreActions}
          onChange={(event) => setFiltreActions(event.target.value as FiltreActions)}
          className="w-full max-w-xs rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          {FILTRES_ACTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.libelle}
            </option>
          ))}
        </select>
        {estPresident ? (
          <select
            value={filtreAccordGouvernance}
            onChange={(event) =>
              setFiltreAccordGouvernance(
                event.target.value as FiltreAccordGouvernance,
              )
            }
            className="w-full max-w-xs rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            {FILTRES_ACCORD_GOUVERNANCE.map((option) => (
              <option key={option.id} value={option.id}>
                {option.libelle}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-neutral-800">
            Avancement moyen des {nombreActionsAffichees} action
            {nombreActionsAffichees > 1 ? "s" : ""}
          </h2>
          <Jauge valeur={avancementMoyenActions} taille={128} />
        </div>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-neutral-800">
            Avancement moyen des {nombreIndicateursAffiches} indicateur
            {nombreIndicateursAffiches > 1 ? "s" : ""}
          </h2>
          <Jauge valeur={avancementMoyenIndicateurs} taille={128} />
        </div>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-neutral-800">
            Action{nombreActionsBloquees > 1 ? "s" : ""} bloquée
            {nombreActionsBloquees > 1 ? "s" : ""}
          </h2>
          <button
            type="button"
            disabled={nombreActionsBloquees === 0}
            onClick={() =>
              setSelectionActions({
                titre: `Actions bloquées (${nombreActionsBloquees})`,
                actions: (actionsAffichees ?? []).filter(
                  (action) => action.bloquee,
                ),
              })
            }
            className="text-6xl font-semibold text-neutral-800 enabled:cursor-pointer enabled:underline enabled:decoration-dotted enabled:underline-offset-8 enabled:hover:text-neutral-600"
          >
            {nombreActionsBloquees}
          </button>
        </div>
        <BlocEcheancesActions
          actions={actionsCalendrier ?? []}
          onSelectionner={(titre, actions) =>
            setSelectionActions({ titre, actions })
          }
        />
      </div>

      <ModaleListeActions
        selection={selectionActions}
        onFermer={() => setSelectionActions(null)}
      />

      {isLoading ? <p className="mt-6 text-neutral-500">Chargement…</p> : null}

      {mesuresAffichees && mesuresAffichees.length === 0 ? (
        <p className="mt-6 text-neutral-500">
          {filtreActions === "bloquees"
            ? "Aucune mesure avec une action bloquée pour le moment."
            : filtreAccordGouvernance !== "tous"
              ? "Aucune mesure pour ce filtre d'accord de gouvernance."
              : secteurId
                ? "Aucune mesure pour ce secteur."
                : "Aucune mesure visible pour votre profil pour le moment."}
        </p>
      ) : null}

      {mesuresAffichees && mesuresAffichees.length > 0 ? (
        <div className="mt-6">
          {vue === "liste" ? <VueListe mesures={mesuresAffichees} /> : null}
          {vue === "tableau" ? <VueTableau mesures={mesuresAffichees} /> : null}
          {vue === "kanban" ? <VueKanban mesures={mesuresAffichees} /> : null}
          {vue === "calendrier" ? (
            <VueCalendrierActions actions={actionsCalendrier ?? []} />
          ) : null}
        </div>
      ) : null}
    </Layout>
  );
};

export default PageAccueil;
