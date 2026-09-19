import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import "@/client/styles/globals.css";
import { trpc } from "@/client/utils/trpc";

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default trpc.withTRPC(App);
