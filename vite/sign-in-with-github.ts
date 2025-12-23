import { frontendCredentials, isOAuthConfigured, makeRedirectUriFrontend } from "./env";

export const signInWithGitHubLink = (reset = false): string | null => {
  // Return null if OAuth is not configured
  if (!isOAuthConfigured()) {
    return null;
  }

  const params = new URLSearchParams();
  params.append("redirect_uri", makeRedirectUriFrontend(reset));
  params.append("client_id", frontendCredentials().VITE_CLIENT_ID);
  params.append("scope", "repo");

  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = params.toString();

  return url.toString();
};
