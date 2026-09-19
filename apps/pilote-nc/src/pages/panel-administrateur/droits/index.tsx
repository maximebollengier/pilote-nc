import Head from "next/head";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { trpc } from "@/client/utils/trpc";
import { Layout } from "@/client/components/Layout";
import {
  ActionDroit,
  ORDRE_ACTION_DROIT,
  LIBELLES_ACTION_DROIT,
  ACTIONS_SCOPEES_PAR_SECTEUR,
} from "@/server/droits/domain/ActionDroit";
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

const ORDRE_PROFIL = Object.keys(LIBELLES_PROFIL) as ProfilEnum[];

const PageDroits = () => {
  const utils = trpc.useContext();
  const { data: droits, isLoading } = trpc.droits.lister.useQuery();
  const definir = trpc.droits.definir.useMutation({
    onSuccess: () => utils.droits.lister.invalidate(),
  });

  const estAutorise = (action: ActionDroit, profil: ProfilEnum): boolean =>
    droits?.find((droit) => droit.action === action && droit.profil === profil)
      ?.autorise ?? false;

  const basculer = (action: ActionDroit, profil: ProfilEnum) => {
    definir.mutate({ action, profil, autorise: !estAutorise(action, profil) });
  };

  return (
    <Layout>
      <Head>
        <title>Droits - PILOTE Nouvelle-Calédonie</title>
      </Head>
      <h1 className="text-2xl font-semibold text-neutral-800">Droits</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Détermine, pour chaque profil, quelles actions de création,
        modification ou suppression sont autorisées sur les mesures, les
        actions et les indicateurs d'impact.
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        Pour Direction NC, les actions marquées{" "}
        <span aria-hidden="true">🔒</span> restent, quel que soit ce réglage,
        limitées aux mesures des secteurs auxquels cet utilisateur est
        habilité.
      </p>

      {isLoading ? <p className="mt-6 text-neutral-500">Chargement…</p> : null}

      {droits ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-neutral-100 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-2">Action</th>
                {ORDRE_PROFIL.map((profil) => (
                  <th key={profil} className="px-4 py-2 text-center">
                    {LIBELLES_PROFIL[profil]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORDRE_ACTION_DROIT.map((action) => (
                <tr key={action} className="border-t border-neutral-100">
                  <td className="px-4 py-2">
                    {LIBELLES_ACTION_DROIT[action]}
                    {ACTIONS_SCOPEES_PAR_SECTEUR.includes(action) ? (
                      <span
                        title="Direction NC reste limité à ses secteurs habilités"
                        aria-label="Direction NC reste limité à ses secteurs habilités"
                        className="ml-1"
                      >
                        🔒
                      </span>
                    ) : null}
                  </td>
                  {ORDRE_PROFIL.map((profil) => (
                    <td key={profil} className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={estAutorise(action, profil)}
                        onChange={() => basculer(action, profil)}
                        disabled={definir.isPending}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {definir.error ? (
        <p className="mt-3 text-sm text-error">{definir.error.message}</p>
      ) : null}
    </Layout>
  );
};

export default PageDroits;
