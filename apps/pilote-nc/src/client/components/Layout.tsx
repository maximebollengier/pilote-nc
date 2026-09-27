import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { trpc } from "@/client/utils/trpc";
import { MenuAdmin } from "@/client/components/MenuAdmin";
import { MenuUtilisateur } from "@/client/components/MenuUtilisateur";

export const Layout = ({ children }: { children: ReactNode }) => {
  const { data: utilisateur } =
    trpc.profilUtilisateur.getUtilisateurConnecte.useQuery();

  const estAdmin = utilisateur?.profil === "ADMIN_OUTIL";
  const estPresident = utilisateur?.profil === "PRESIDENT";
  const estSg = utilisateur?.profil === "SECRETARIAT_GENERAL";

  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const fermerMenuMobile = () => setMenuMobileOuvert(false);
  const menuMobileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuMobileOuvert) return;

    const surClicExterieur = (event: MouseEvent) => {
      if (!menuMobileRef.current?.contains(event.target as Node)) {
        fermerMenuMobile();
      }
    };
    const surTouche = (event: KeyboardEvent) => {
      if (event.key === "Escape") fermerMenuMobile();
    };

    document.addEventListener("mousedown", surClicExterieur);
    window.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("mousedown", surClicExterieur);
      window.removeEventListener("keydown", surTouche);
    };
  }, [menuMobileOuvert]);

  // Rendu deux fois (nav du haut sur écran large, panneau replié en dessous
  // de `md` sur petit écran) : voir le commentaire sur le <nav> plus bas.
  const liensNav = (
    <>
      <Link href="/" className="hover:text-primary" onClick={fermerMenuMobile}>
        Tableau de bord
      </Link>
      {estAdmin || estPresident ? (
        <Link
          href="/panel-administrateur/mesures"
          className="hover:text-primary"
          onClick={fermerMenuMobile}
        >
          Mesures
        </Link>
      ) : null}
      <Link href="/actions" className="hover:text-primary" onClick={fermerMenuMobile}>
        Actions
      </Link>
      {estAdmin ? <MenuAdmin /> : null}
      {estSg ? (
        <Link
          href="/panel-administrateur/pva"
          className="hover:text-primary"
          onClick={fermerMenuMobile}
        >
          Validations en attente
        </Link>
      ) : null}
      {utilisateur ? <MenuUtilisateur email={utilisateur.email} /> : null}
    </>
  );

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

          {/* Écran large : navigation complète sur une ligne. */}
          <nav className="hidden items-center gap-4 text-sm text-neutral-600 md:flex">
            {liensNav}
          </nav>

          {/* Petit écran : la navigation se replie derrière ce bouton, pour
              ne pas chevaucher le logo (cf. le <nav> ci-dessus, caché ici). */}
          <button
            type="button"
            onClick={() => setMenuMobileOuvert((actuel) => !actuel)}
            aria-expanded={menuMobileOuvert}
            aria-label="Ouvrir le menu"
            className="flex h-9 w-9 items-center justify-center rounded text-xl text-neutral-600 hover:bg-neutral-100 md:hidden"
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>

        {menuMobileOuvert ? (
          <nav
            ref={menuMobileRef}
            className="flex flex-col items-start gap-1 border-t border-neutral-200 px-6 py-3 text-sm text-neutral-600 md:hidden"
          >
            {liensNav}
          </nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
};
