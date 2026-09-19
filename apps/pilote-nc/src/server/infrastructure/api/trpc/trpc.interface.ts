import { type Session } from "next-auth";

export type CreateContextOptions = {
  session: Session | null;
};
