import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";
import { créerContextTRPC } from "@/server/infrastructure/api/trpc/trpc";

export default createNextApiHandler({
  router: appRouter,
  createContext: créerContextTRPC,
});
