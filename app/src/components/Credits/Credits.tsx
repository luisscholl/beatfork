import React, { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { viewState } from "../../atoms/viewState";
import "./Credits.scss";

const Credits = () => {
  const [creditsText, setCreditsText] = useState<{
    license: string;
    licenseSongs: string;
    license3rdParty: string;
  }>({
    license: "Loading license...",
    licenseSongs: "Loading song notices",
    license3rdParty: "Loading 3rd party notices...",
  });
  const setView = useSetRecoilState(viewState);

  useEffect(() => {
    fetch("./LICENSE.txt")
      .then((license) => license.text())
      .then((license) => {
        setCreditsText((creditsTextLocal) => {
          const creditsTextCopy = JSON.parse(JSON.stringify(creditsTextLocal));
          creditsTextCopy.license = license;
          return creditsTextCopy;
        });
      });
    fetch("./LICENSE-SONGS.txt")
      .then((licenseSongs) => licenseSongs.text())
      .then((licenseSongs) => {
        setCreditsText((creditsTextLocal) => {
          const creditsTextCopy = JSON.parse(JSON.stringify(creditsTextLocal));
          creditsTextCopy.licenseSongs = licenseSongs;
          return creditsTextCopy;
        });
      });
    fetch("./LICENSE-3RD-PARTY.txt")
      .then((license3rdParty) => license3rdParty.text())
      .then((license3rdParty) => {
        setCreditsText((creditsTextLocal) => {
          const creditsTextCopy = JSON.parse(JSON.stringify(creditsTextLocal));
          creditsTextCopy.license3rdParty = license3rdParty;
          return creditsTextCopy;
        });
      });
  }, []);

  return (
    <div className="Credits" data-testid="Credits">
      {window.location.pathname === "play" && (
        <button
          type="button"
          className="back-button"
          onClick={() => {
            setView({ view: "main-menu" });
          }}
        >
          BACK
        </button>
      )}
      <div className="wrapper">
        <div className="content">
          <h2>License</h2>
          <pre>{creditsText.license}</pre>
          <h2>Song Notices</h2>
          <pre>{creditsText.licenseSongs}</pre>
          <h2>3rd Party Notices</h2>
          <pre>{creditsText.license3rdParty}</pre>
        </div>
      </div>
    </div>
  );
};

export default Credits;
