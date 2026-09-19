import Head from "next/head";
import { useMemo, useState } from "react";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { trpc } from "@/client/utils/trpc";
import { Layout } from "@/client/components/Layout";

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

type Colonne = "action" | "auteurNom" | "date";

const COLONNES: { cle: Colonne; libelle: string }[] = [
  { cle: "action", libelle: "Nom de l'action" },
  { cle: "auteurNom", libelle: "Auteur" },
  { cle: "date", libelle: "Date et heure" },
];

const formaterDate = (date: Date) =>
  date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const PageLogs = () => {
  const { data: entrees, isLoading } = trpc.journal.lister.useQuery();
  const [tri, setTri] = useState<{ colonne: Colonne; croissant: boolean }>({
    colonne: "date",
    croissant: false,
  });

  const basculerTri = (colonne: Colonne) => {
    setTri((triActuel) =>
      triActuel.colonne === colonne
        ? { colonne, croissant: !triActuel.croissant }
        : { colonne, croissant: colonne !== "date" },
    );
  };

  const entreesTriees = useMemo(() => {
    if (!entrees) return entrees;
    return [...entrees].sort((a, b) => {
      const signe = tri.croissant ? 1 : -1;
      if (tri.colonne === "date") {
        return (a.date.getTime() - b.date.getTime()) * signe;
      }
      return a[tri.colonne].localeCompare(b[tri.colonne]) * signe;
    });
  }, [entrees, tri]);

  return (
    <Layout>
      <Head>
        <title>Logs - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <h1 className="text-2xl font-semibold text-neutral-800">Logs</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Historique des actions effectuées par les utilisateurs.
      </p>

      {isLoading ? <p className="mt-6 text-neutral-500">Chargement…</p> : null}

      {entreesTriees && entreesTriees.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-neutral-100 text-left text-neutral-600">
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
              </tr>
            </thead>
            <tbody>
              {entreesTriees.map((entree) => (
                <tr key={entree.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2">{entree.action}</td>
                  <td className="px-4 py-2 text-neutral-600">{entree.auteurNom}</td>
                  <td className="px-4 py-2 text-neutral-600">
                    {formaterDate(entree.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Layout>
  );
};

export default PageLogs;
