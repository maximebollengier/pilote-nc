import Link from "next/link";
import { signOut } from "next-auth/react";
import { ReactNode } from "react";
import { trpc } from "@/client/utils/trpc";
import { MenuAdmin } from "@/client/components/MenuAdmin";

export const Layout = ({ children }: { children: ReactNode }) => {
  const { data: utilisateur } =
    trpc.profilUtilisateur.getUtilisateurConnecte.useQuery();

  const estAdmin = utilisateur?.profil === "ADMIN_OUTIL";
  const estPresident = utilisateur?.profil === "PRESIDENT";
  const estSg = utilisateur?.profil === "SECRETARIAT_GENERAL";

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 font-semibold text-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image
                passe par l'optimiseur, dont la requête interne vers
                /logo-gouv-nc.png est bloquée par le middleware d'authentification */}
            <img
              src="/logo-gouv-nc.png"
              alt="Gouvernement de la Nouvelle-Calédonie"
              width={158}
              height={40}
            />
            <span>PILOTE</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-neutral-600">
            <Link href="/" className="hover:text-primary">
              Tableau de bord
            </Link>
            {estAdmin || estPresident ? (
              <Link
                href="/panel-administrateur/mesures"
                className="hover:text-primary"
              >
                Mesures
              </Link>
            ) : null}
            <Link href="/actions" className="hover:text-primary">
              Actions
            </Link>
            {estAdmin ? <MenuAdmin /> : null}
            {estSg ? (
              <Link href="/panel-administrateur/pva" className="hover:text-primary">
                Validations en attente
              </Link>
            ) : null}
            {utilisateur ? (
              <span className="flex items-center gap-2">
                <span>{utilisateur.email}</span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/connexion" })}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
                >
                  Se déconnecter
                </button>
              </span>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
};
