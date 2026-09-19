import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { PiloteError } from "@/server/app/error-boundary/pilote-error";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";
import { ActionDroit } from "@/server/droits/domain/ActionDroit";
import { estAutorise } from "@/server/droits/domain/estAutorise";
import { CreateContextOptions } from "./trpc.interface";

const créerContextTRPCInterne = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
  };
};

export const créerContextTRPC = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;
  const session = await auth(req, res);

  return créerContextTRPCInterne({ session });
};

const trpc = initTRPC.context<typeof créerContextTRPC>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const formattedData = { ...shape.data };
    delete formattedData.stack;
    const piloteCause = PiloteError.isPiloteError(error.cause)
      ? error.cause
      : null;
    return {
      ...shape,
      message: piloteCause ? shape.message : "Une erreur est survenue",
      data: {
        ...formattedData,
        httpStatus: piloteCause?.status ?? formattedData.httpStatus,
        code: piloteCause?.type ?? formattedData.code,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

const vérifierSiUtilisateurEstConnectéTRPCMiddleware = trpc.middleware(
  ({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  },
);

// Défense en profondeur pour les routes à contrôle global simple
// (ADMIN_OUTIL-only, SECRETARIAT_GENERAL-only, ...). Les contrôles scopés par
// Secteur restent manuels dans le resolver (cf. Habilitation.ts), car le
// middleware ne connaît pas encore l'entité ciblée avant le parsing de
// l'input.
export const procédureAvecProfil = (profilsAutorises: ProfilEnum[]) =>
  procédureProtégée.use(({ ctx, next }) => {
    if (!profilsAutorises.includes(ctx.session.profil)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });

// Variante de `procédureAvecProfil` pour les actions couvertes par la
// matrice de droits configurable (page Admin > Droits) : les profils
// autorisés ne sont plus une liste figée dans le code, mais lus (avec
// repli sur les valeurs par défaut) à chaque requête.
export const procédureAvecDroit = (action: ActionDroit) =>
  procédureProtégée.use(async ({ ctx, next }) => {
    const surcharges = await getContainer("droits")
      .resolve("droitRepository")
      .listerSurcharges();
    if (!estAutorise(surcharges, action, ctx.session.profil)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });

export const créerRouteurTRPC = trpc.router;
export const procédureProtégée = trpc.procedure.use(
  vérifierSiUtilisateurEstConnectéTRPCMiddleware,
);
export const procédureNonConnecte = trpc.procedure;
