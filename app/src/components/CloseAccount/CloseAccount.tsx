import React, { FC, useState } from "react";
import { useAuth } from "react-oidc-context";
import "./CloseAccount.scss";

interface CloseAccountProps {}

const CloseAccount: FC<CloseAccountProps> = () => {
  const auth = useAuth();

  const [state, setState] = useState<"initial" | "really" | "closed">(
    "initial"
  );
  const warn = () => {
    setState("really");
  };
  const cancel = () => {
    setState("initial");
  };
  const closeAccount = () => {
    // todo
    setState("closed");
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="CloseAccount" data-testid="CloseAccount">
        <div>
          <p>You need to be logged in in order to close your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="CloseAccount" data-testid="CloseAccount">
      <div>
        {state === "initial" && (
          <>
            <p>
              You can close your account by clicking the button below.
              <br />
              <b>Your account will not be recoverable.</b>
            </p>
            <div className="buttons">
              <button type="button" onClick={warn}>
                Close Account
              </button>
            </div>
          </>
        )}
        {state === "really" && (
          <>
            <p>
              Are you sure?
              <br />
              <b>Your account will not be recoverable.</b>
            </p>
            <div className="buttons">
              <button type="button" onClick={cancel}>
                Cancel
              </button>
              <button type="button" onClick={closeAccount}>
                Close Account
              </button>
            </div>
          </>
        )}
        {state === "closed" && (
          <div>
            <p>Your account was closed.</p>
            <p>
              Even though we are parting ways, we would be delighted to hear
              what led to this, so we can improve our services. Feel free to
              reach out via email at{" "}
              <a href="mailto:account-closure-feedback@beatfork.com">
                account-closure-feedback@beatfork.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloseAccount;
