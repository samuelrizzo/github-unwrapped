import { config } from "dotenv";
import { z } from "zod";
import { REDIRECT_URL_ENDPOINT } from "./redirect-url.js";

const parseAwsCredentials = () => {
  return z
    .object({
      AWS_KEY_1: z.string(),
      AWS_SECRET_1: z.string(),
      AWS_KEY_2: z.string().optional(),
      AWS_SECRET_2: z.string().optional(),
      AWS_KEY_3: z.string().optional(),
      AWS_SECRET_3: z.string().optional(),
      AWS_KEY_4: z.string().optional(),
      AWS_SECRET_4: z.string().optional(),
    })
    .parse(process.env);
};

let parsedAwsCredentials: ReturnType<typeof parseAwsCredentials> | null = null;

export const awsCredentials = () => {
  if (!parsedAwsCredentials) {
    config();
    parsedAwsCredentials = parseAwsCredentials();
  }

  return parsedAwsCredentials;
};

const parseBackendCredentials = () => {
  return z
    .object({
      VITE_CLIENT_ID: z.string().optional().default(""),
      VITE_HOST: z.string(),
      CLIENT_SECRET: z.string().optional().default(""),
      NODE_ENV: z.enum(["development", "production"]),
      DB_NAME: z.string(),
      DB_USER: z.string().optional().default(""),
      DB_PASSWORD: z.string().optional().default(""),
      DB_HOST: z.string(),
      DISCORD_CHANNEL: z.string().optional().default(""),
      DISCORD_TOKEN: z.string().optional().default(""),
      GITHUB_TOKEN_1: z.string(),
      GITHUB_TOKEN_2: z.string().optional().default(""),
      GITHUB_TOKEN_3: z.string().optional().default(""),
      GITHUB_TOKEN_4: z.string().optional().default(""),
      GITHUB_TOKEN_5: z.string().optional().default(""),
      GITHUB_TOKEN_6: z.string().optional().default(""),
      SENTRY_DSN: z.string().optional().default(""),
    })
    .parse(process.env);
};

let parsedBackendCredentials: ReturnType<
  typeof parseBackendCredentials
> | null = null;

export const backendCredentials = () => {
  if (!parsedBackendCredentials) {
    config();
    parsedBackendCredentials = parseBackendCredentials();
  }

  return parsedBackendCredentials;
};

export const makeRedirectUriBackend = () => {
  return `${backendCredentials().VITE_HOST}${REDIRECT_URL_ENDPOINT}`;
};
