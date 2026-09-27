import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

/**
 * Bouton de l'utilisateur connecté : gagne de la place dans le menu du haut
 * en remplaçant [email] [Se déconnecter] par un seul bouton (email + flèche),
 * qui ouvre l'action de déconnexion au clic. Même comportement que
 * `MenuAdmin` (clic extérieur / Échap pour fermer).
 */
export const MenuUtilisateur = ({ email }: { email: string }) => {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ouvert) return;

    const surClicExterieur = (event: MouseEvent) => {
      if (!conteneurRef.current?.contains(event.target as Node)) {
        setOuvert(false);
      }
    };
    const surTouche = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOuvert(false);
    };

    document.addEventListener("mousedown", surClicExterieur);
    window.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("mousedown", surClicExterieur);
      window.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  return (
    <div ref={conteneurRef} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((actuel) => !actuel)}
        aria-expanded={ouvert}
        aria-haspopup="menu"
        className="flex max-w-[160px] items-center gap-1 hover:text-primary"
      >
        <span className="truncate">{email}</span>
        <span aria-hidden="true" className="shrink-0 text-xs">
          ▾
        </span>
      </button>
      {ouvert ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-2 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/connexion" })}
            className="block w-full px-4 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-100 hover:text-primary"
          >
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  );
};
