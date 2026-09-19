import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const LIENS_ADMIN = [
  { href: "/panel-administrateur/referentiels/secteurs", libelle: "Secteurs" },
  {
    href: "/panel-administrateur/referentiels/directions",
    libelle: "Directions",
  },
  { href: "/panel-administrateur/utilisateurs", libelle: "Utilisateurs" },
  { href: "/panel-administrateur/droits", libelle: "Droits" },
  { href: "/panel-administrateur/logs", libelle: "Logs" },
];

export const MenuAdmin = () => {
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
        className="flex items-center gap-1 hover:text-primary"
      >
        Admin
        <span aria-hidden="true" className="text-xs">
          ▾
        </span>
      </button>
      {ouvert ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-2 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {LIENS_ADMIN.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              role="menuitem"
              onClick={() => setOuvert(false)}
              className="block px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-primary"
            >
              {lien.libelle}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
};
