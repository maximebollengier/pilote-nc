import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * Enveloppe un conteneur à défilement horizontal (vues Tableau et Kanban)
 * d'un indice visuel — une ombre sur le bord droit — tant qu'il reste du
 * contenu à faire défiler. Sans repère, ces vues sont peu lisibles au
 * premier coup d'œil sur un écran étroit.
 */
export const DefilementHorizontal = ({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [peutDefiler, setPeutDefiler] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const actualiser = () => {
      setPeutDefiler(
        element.scrollWidth - element.clientWidth - element.scrollLeft > 4,
      );
    };

    actualiser();
    element.addEventListener("scroll", actualiser);
    window.addEventListener("resize", actualiser);
    const observateur = new ResizeObserver(actualiser);
    observateur.observe(element);

    return () => {
      element.removeEventListener("scroll", actualiser);
      window.removeEventListener("resize", actualiser);
      observateur.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${
        peutDefiler ? "shadow-[inset_-16px_0_12px_-14px_rgba(0,0,0,0.35)]" : ""
      }`}
    >
      {children}
    </div>
  );
};
