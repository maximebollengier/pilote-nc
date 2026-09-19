import Head from "next/head";
import { useState, FormEvent } from "react";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { trpc } from "@/client/utils/trpc";
import { Layout } from "@/client/components/Layout";
import { Modal } from "@/client/components/Modal";
import { LIBELLES_PROFIL, ProfilEnum } from "@/server/app/enum/profil.enum";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);
  if (!session) {
    return { redirect: { destination: "/connexion", permanent: false } };
  }
  if (session.profil !== "ADMIN_OUTIL") {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
};

type Utilisateur = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profil: ProfilEnum;
  habilitationsSecteur: string[];
};
type Secteur = { id: string; code: string; nom: string };

const LigneUtilisateur = ({
  utilisateur,
  secteurs,
}: {
  utilisateur: Utilisateur;
  secteurs: Secteur[] | undefined;
}) => {
  const utils = trpc.useContext();
  const modifier = trpc.utilisateurs.modifierHabilitationsSecteur.useMutation({
    onSuccess: () => utils.utilisateurs.lister.invalidate(),
  });

  const [enEdition, setEnEdition] = useState(false);
  const [secteurIds, setSecteurIds] = useState<string[]>(
    utilisateur.habilitationsSecteur,
  );

  const basculerSecteur = (id: string) => {
    setSecteurIds((actuel) =>
      actuel.includes(id)
        ? actuel.filter((secteurId) => secteurId !== id)
        : [...actuel, id],
    );
  };

  const annuler = () => {
    setSecteurIds(utilisateur.habilitationsSecteur);
    setEnEdition(false);
  };

  return (
    <tr className="border-t border-neutral-100 align-top">
      <td className="px-4 py-2">
        {utilisateur.prenom} {utilisateur.nom}
      </td>
      <td className="px-4 py-2 text-neutral-600">{utilisateur.email}</td>
      <td className="px-4 py-2 text-neutral-600">
        {LIBELLES_PROFIL[utilisateur.profil]}
      </td>
      <td className="px-4 py-2">
        {enEdition ? (
          <div className="flex flex-wrap gap-2">
            {secteurs?.map((secteur) => (
              <label
                key={secteur.id}
                className="flex items-center gap-1 rounded border border-neutral-300 px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={secteurIds.includes(secteur.id)}
                  onChange={() => basculerSecteur(secteur.id)}
                />
                {secteur.nom}
              </label>
            ))}
            {secteurs && secteurs.length === 0 ? (
              <span className="text-xs text-neutral-500">
                Aucun secteur défini.
              </span>
            ) : null}
          </div>
        ) : utilisateur.habilitationsSecteur.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {utilisateur.habilitationsSecteur.map((id) => {
              const secteur = secteurs?.find((candidat) => candidat.id === id);
              return secteur ? (
                <span
                  key={id}
                  className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
                >
                  {secteur.nom}
                </span>
              ) : null;
            })}
          </div>
        ) : (
          <span className="text-sm text-neutral-400">Aucun secteur</span>
        )}
      </td>
      <td className="px-4 py-2">
        {enEdition ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={modifier.isPending}
              onClick={() =>
                modifier.mutate(
                  { utilisateurId: utilisateur.id, secteurIds },
                  { onSuccess: () => setEnEdition(false) },
                )
              }
              className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary-hover disabled:opacity-50"
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
        ) : (
          <button
            type="button"
            onClick={() => setEnEdition(true)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
          >
            Modifier les secteurs
          </button>
        )}
        {modifier.error ? (
          <p className="mt-1 text-xs text-error">{modifier.error.message}</p>
        ) : null}
      </td>
    </tr>
  );
};

const FormulaireNouvelUtilisateur = ({ onCreated }: { onCreated: () => void }) => {
  const utils = trpc.useContext();
  const creer = trpc.utilisateurs.creer.useMutation({
    onSuccess: () => utils.utilisateurs.lister.invalidate(),
  });

  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [profil, setProfil] = useState<ProfilEnum>(ProfilEnum.DIRECTION_NC);
  const [transparenceGlobale, setTransparenceGlobale] = useState(false);

  const soumettre = (event: FormEvent) => {
    event.preventDefault();
    creer.mutate(
      { email, nom, prenom, profil, transparenceGlobale },
      {
        onSuccess: () => {
          setEmail("");
          setNom("");
          setPrenom("");
          setProfil(ProfilEnum.DIRECTION_NC);
          setTransparenceGlobale(false);
          onCreated();
        },
      },
    );
  };

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Prénom
        <input
          value={prenom}
          onChange={(event) => setPrenom(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Nom
        <input
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Profil
        <select
          value={profil}
          onChange={(event) => setProfil(event.target.value as ProfilEnum)}
          className="rounded border border-neutral-300 px-3 py-2"
        >
          {Object.entries(LIBELLES_PROFIL).map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </label>
      {profil === ProfilEnum.MEMBRE_GOUVERNEMENT ? (
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Transparence globale
          <select
            value={transparenceGlobale ? "oui" : "non"}
            onChange={(event) =>
              setTransparenceGlobale(event.target.value === "oui")
            }
            className="rounded border border-neutral-300 px-3 py-2"
          >
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </label>
      ) : null}
      <button
        type="submit"
        disabled={creer.isPending || !email || !nom || !prenom}
        className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
      >
        Ajouter l'utilisateur
      </button>
      {creer.error ? (
        <p className="text-sm text-error">{creer.error.message}</p>
      ) : null}
    </form>
  );
};

const PageUtilisateurs = () => {
  const { data: utilisateurs } = trpc.utilisateurs.lister.useQuery();
  const { data: secteurs } = trpc.secteurs.lister.useQuery();
  const [modaleCreationOuverte, setModaleCreationOuverte] = useState(false);

  return (
    <Layout>
      <Head>
        <title>Utilisateurs - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-800">Utilisateurs</h1>
        <button
          type="button"
          onClick={() => setModaleCreationOuverte(true)}
          className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Ajouter un utilisateur
        </button>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Un utilisateur peut être rattaché à 0, 1 ou plusieurs secteurs. Ce
        rattachement détermine les mesures qu'il peut consulter ou faire
        évoluer (Direction NC) ou consulter (Membre du gouvernement sans
        transparence globale).
      </p>

      <Modal
        open={modaleCreationOuverte}
        titre="Ajouter un utilisateur"
        onFermer={() => setModaleCreationOuverte(false)}
      >
        <FormulaireNouvelUtilisateur
          onCreated={() => setModaleCreationOuverte(false)}
        />
      </Modal>

      <table className="mt-6 w-full border-collapse overflow-hidden rounded-lg border border-neutral-200 bg-white text-sm">
        <thead className="bg-neutral-100 text-left text-neutral-600">
          <tr>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Profil</th>
            <th className="px-4 py-2">Secteurs</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {utilisateurs?.map((utilisateur) => (
            <LigneUtilisateur
              key={utilisateur.id}
              utilisateur={utilisateur}
              secteurs={secteurs}
            />
          ))}
        </tbody>
      </table>
    </Layout>
  );
};

export default PageUtilisateurs;
