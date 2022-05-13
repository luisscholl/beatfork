import React from "react";
import { useAuth } from "react-oidc-context";
import { useRecoilState } from "recoil";
import { viewState } from "../../atoms/viewState";
import "./NavBar.scss";

const links = [
  { name: "About", view: "about" },
  { name: "Home", view: "home" },
  { name: "Browse", view: "browse" },
  { name: "My Levels", view: "my-levels" },
];

const NavBar = () => {
  const [view, setView] = useRecoilState(viewState);
  const auth = useAuth();

  if (!["about", "home", "browse", "my-levels", "profile"].includes(view.view))
    return null;

  return (
    <div className="NavBar" data-testid="NavBar">
      {links.map((link) => (
        <button
          type="button"
          className={view.view === link.view ? "active" : ""}
          key={link.view}
          onClick={() =>
            setView({
              view: link.view as "about" | "home" | "browse" | "my-levels",
            })
          }
        >
          {link.name}
        </button>
      ))}
      {auth.activeNavigator === "signinSilent" && <div>Signing you in...</div>}
      {auth.activeNavigator === "signoutRedirect" && (
        <div>Signing you out...</div>
      )}
      {auth.isLoading && <div>Loading...</div>}
      {auth.error && <div>Oops... {auth.error.message}</div>}
      {auth.isAuthenticated && (
        <div>
          Hello {auth.user?.profile.sub}{" "}
          <button type="button" onClick={() => auth.removeUser()}>
            Log out
          </button>
        </div>
      )}
      {auth.activeNavigator !== "signinSilent" &&
        auth.activeNavigator !== "signinRedirect" &&
        !auth.isLoading &&
        !auth.error &&
        !auth.isAuthenticated && (
          <button type="button" onClick={() => auth.signinRedirect()}>
            Log in
          </button>
        )}
    </div>
  );
};

export default NavBar;
