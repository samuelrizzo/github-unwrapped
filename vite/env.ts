import { z } from "zod";
import { REDIRECT_URL_ENDPOINT } from "../src/helpers/redirect-url";

const frontendSchema = z.object({
  VITE_CLIENT_ID: z.string().optional().default(""),
  VITE_HOST: z.string(),
});

export const frontendCredentials = () => frontendSchema.parse(import.meta.env);

export const isOAuthConfigured = () => {
  const clientId = frontendCredentials().VITE_CLIENT_ID;
  return clientId && clientId.length > 0;
};

export const makeRedirectUriFrontend = (reset: boolean = false) => {
  return `${
    frontendCredentials().VITE_HOST
  }${REDIRECT_URL_ENDPOINT}?reset=${reset}`;
};
