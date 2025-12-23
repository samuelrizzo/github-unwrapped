import { backendCredentials } from "../helpers/domain.js";

let i = 0;

// Get all valid tokens (non-empty)
const getValidTokens = (): string[] => {
  const creds = backendCredentials();
  const tokens = [
    creds.GITHUB_TOKEN_1,
    creds.GITHUB_TOKEN_2,
    creds.GITHUB_TOKEN_3,
    creds.GITHUB_TOKEN_4,
    creds.GITHUB_TOKEN_5,
    creds.GITHUB_TOKEN_6,
  ].filter((token) => token && token.length > 0);

  if (tokens.length === 0) {
    throw new Error("At least one GitHub token is required");
  }

  return tokens;
};

export const getRandomGithubToken = (): string => {
  const tokens = getValidTokens();
  i++;
  const index = i % tokens.length;
  return tokens[index];
};
