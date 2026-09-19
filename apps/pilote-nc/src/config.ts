import convict from "convict";

const config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  baseUrl: {
    format: String,
    default: "http://localhost:3000",
    env: "BASE_URL",
  },
  logLevel: {
    format: String,
    default: "info",
    env: "LOG_LEVEL",
  },
  databaseUrl: {
    format: String,
    default: "ToBeDefined",
    env: "DATABASE_URL",
  },
  devPassword: {
    format: String,
    default: "",
    doc: "Mot de passe admin optionnel pour le dev local. Remplace complètement Keycloak.",
    env: "DEV_PASSWORD",
  },
  nextAuth: {
    secret: {
      format: String,
      default: "next_auth_secret",
      env: "NEXTAUTH_SECRET",
    },
    url: {
      format: String,
      default: "http://localhost:3000",
      env: "NEXTAUTH_URL",
    },
    sessionMaxAge: {
      format: Number,
      default: 2_592_000,
      env: "NEXTAUTH_SESSION_MAX_AGE_IN_SECONDS",
    },
  },
  keycloak: {
    doc: "Fournisseur d'identité. Obligatoire hors mode DEV_PASSWORD.",
    clientId: {
      format: String,
      default: "ToBeDefined",
      env: "KEYCLOAK_CLIENT_ID",
    },
    clientSecret: {
      format: String,
      default: "ToBeDefined",
      env: "KEYCLOAK_CLIENT_SECRET",
    },
    issuer: {
      format: String,
      default: "ToBeDefined",
      env: "KEYCLOAK_ISSUER",
    },
    publicIssuer: {
      format: String,
      default: "ToBeDefined",
      env: "KEYCLOAK_PUBLIC_ISSUER",
    },
    tokenUrl: {
      format: String,
      default: "ToBeDefined",
    },
    authUrl: {
      format: String,
      default: "ToBeDefined",
    },
    logoutUrl: {
      format: String,
      default: "ToBeDefined",
    },
  },
});

config.set(
  "keycloak.tokenUrl",
  config.get("keycloak.issuer") + "/protocol/openid-connect/token",
);
config.set(
  "keycloak.authUrl",
  config.get("keycloak.publicIssuer") + "/protocol/openid-connect/auth",
);
config.set(
  "keycloak.logoutUrl",
  config.get("keycloak.issuer") + "/protocol/openid-connect/logout",
);

config.validate({ allowed: "strict" });

export const baseConfig = config;

export const configuration = () => config.get();
