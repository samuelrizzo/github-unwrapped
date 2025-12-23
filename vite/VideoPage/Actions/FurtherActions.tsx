import { Link } from "@tanstack/react-router";
import { PrivateContributionsIcon } from "../../../icons/PrivateContributionsIcon";
import { UserIcon } from "../../../icons/UserIcon";
import { signInWithGitHubLink } from "../../sign-in-with-github";
import { FurtherAction } from "./FurtherAction";
import styles from "./styles.module.css";

export const FurtherActions: React.FC = () => {
  if (window.__USER__ === "not-found") {
    return;
  }

  const oauthLink = signInWithGitHubLink();
  const showPrivateMetrics = !window.__USER__!.loggedInWithGitHub && oauthLink;

  return (
    <div className={styles.furtherActionsWrapper}>
      <div className={styles.furtherActionsButtonContainer}>
        <Link to="/">
          <FurtherAction
            icon={(params) => <UserIcon {...params} width={15} />}
            label="Unwrap another user"
          />
        </Link>
        {showPrivateMetrics ? (
          <a href={oauthLink}>
            <FurtherAction
              icon={(params) => (
                <PrivateContributionsIcon {...params} width={18} />
              )}
              label="Unlock private metrics"
            />
          </a>
        ) : null}
      </div>
    </div>
  );
};
