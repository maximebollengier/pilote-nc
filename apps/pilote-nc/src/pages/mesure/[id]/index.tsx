import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, FormEvent } from "react";
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

const LigneAction = ({
  action,
  peutSaisir,
}: {
  action: {
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
  const [valeur, setValeur] = useState(String(action.tauxAvancement));
  const [datePrevisionnelleDebut, setDatePrevisionnelleDebut] = useState(
    versValeurInput(action.datePrevisionnelleDebut),
  );
  const [datePrevisionnelleFin, setDatePrevisionnelleFin] = useState(
    versValeurInput(action.datePrevisionnelleFin),
  );

  return (
    <tr className="border-t border-neutral-100">
      <td className="px-4 py-2">{action.titre}</td>
      <td className="px-4 py-2">{LIBELLES_TYPE_ACTION[action.type]}</td>
      {peutSaisir ? (
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
        {peutSaisir ? (
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
          </form>
        ) : (
          `${action.tauxAvancement}%`
        )}
      </td>
      <td className="px-4 py-2">
        <BadgeBloquee action={action} peutGerer={peutSaisir} onChanged={invalider} />
      </td>
    </tr>
  );
};

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
  const [sensEvolution, setSensEvolution] = useState<"A_LA_HAUSSE" | "A_LA_BAISSE">(
    "A_LA_HAUSSE",
  );

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
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Nom de l'indicateur
        <input
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Valeur initiale
        <input
          type="number"
          value={valeurInitiale}
          onChange={(event) => setValeurInitiale(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Valeur cible
        <input
          type="number"
          value={valeurCible}
          onChange={(event) => setValeurCible(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Sens d'évolution
        <select
          value={sensEvolution}
          onChange={(event) =>
            setSensEvolution(event.target.value as "A_LA_HAUSSE" | "A_LA_BAISSE")
          }
          className="rounded border border-neutral-300 px-3 py-2"
        >
          <option value="A_LA_HAUSSE">À la hausse</option>
          <option value="A_LA_BAISSE">À la baisse</option>
        </select>
      </label>
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
    <div className="mt-1 flex items-center gap-2">
      <select
        value={statutActuel}
        onChange={(event) =>
          modifier.mutate({
            id: mesureId,
            statut: event.target.value as StatutMesure,
          })
        }
        disabled={modifier.isPending}
        className="rounded border border-neutral-300 px-2 py-1 text-sm text-neutral-700 disabled:opacity-50"
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

  if (mesureEnChargement) {
    return (
      <Layout>
        <p className="text-neutral-500">Chargement…</p>
      </Layout>
    );
  }

  if (!mesure) {
    return (
      <Layout>
        <p className="text-neutral-500">
          Mesure introuvable, ou vous n'avez pas les droits pour la consulter.
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

      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        ← Retour au tableau de bord
      </Link>

      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-secondary">
        {LIBELLES_MESURE_PRIORITAIRE[mesure.mesurePrioritaire]}
      </p>
      <p className="text-xs text-neutral-500">{mesure.code}</p>
      <h1 className="text-2xl font-semibold text-neutral-800">
        {mesure.titre}
      </h1>
      {estAdmin || estPresident ? (
        <SelecteurStatutMesure mesureId={mesure.id} statutActuel={mesure.statut} />
      ) : (
        <p className="mt-1 text-sm text-neutral-600">
          {LIBELLES_STATUT_MESURE[mesure.statut]}
        </p>
      )}

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-medium text-neutral-800">Météo de la mesure</h2>
        <p className="mt-2 text-3xl font-semibold text-primary">
          {mesure.meteoAvancement === null
            ? "—"
            : `${Math.round(mesure.meteoAvancement)}%`}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Moyenne automatique du taux d'avancement des actions liées.
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium text-neutral-800">Actions</h2>
          {estAdmin || estDirectionNc ? (
            <button
              type="button"
              onClick={() => setModaleCreationActionOuverte(true)}
              className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Ajouter une action
            </button>
          ) : null}
        </div>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead className="text-left text-neutral-600">
            <tr>
              <th className="px-4 py-2">Titre</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Début prévisionnel</th>
              <th className="px-4 py-2">Fin prévisionnelle</th>
              <th className="px-4 py-2">Avancement</th>
              <th className="px-4 py-2">Bloquée</th>
            </tr>
          </thead>
          <tbody>
            {actions?.map((action) => (
              <LigneAction
                key={action.id}
                action={action}
                peutSaisir={estDirectionNc}
              />
            ))}
          </tbody>
        </table>
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
            Indicateurs d'impact
          </h2>
          <div className="flex items-center gap-3">
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
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {indicateurs?.map((indicateur) => (
                <tr key={indicateur.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2">
                    <Link
                      href={`/mesure/${mesure.id}/indicateur/${indicateur.id}`}
                      className="text-primary hover:underline"
                    >
                      {indicateur.nom}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{indicateur.valeurInitiale}</td>
                  <td className="px-4 py-2">
                    {indicateur.valeurActuelle ?? "—"}
                  </td>
                  <td className="px-4 py-2">{indicateur.valeurCible}</td>
                  <td className="px-4 py-2">
                    {indicateur.tauxRealisation === null
                      ? "—"
                      : `${Math.round(indicateur.tauxRealisation)}%`}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/mesure/${mesure.id}/indicateur/${indicateur.id}`}
                      className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                    >
                      Voir détails
                    </Link>
                  </td>
                </tr>
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
            titre="Ajouter un indicateur d'impact"
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
