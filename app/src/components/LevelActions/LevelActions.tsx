import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useRecoilState } from "recoil";
import { faEdit, faList, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "react-oidc-context";
import { viewState } from "../../atoms/viewState";
import "./LevelActions.scss";

const LevelActions = () => {
  const auth = useAuth();

  const [view, setView] = useRecoilState(viewState);

  if (!(view as any).level) return null;

  return (
    <div className="LevelActions" data-testid="LevelActions">
      <div className="columns">
        <button type="button">
          <FontAwesomeIcon icon={faList} />
          Add to playlist
        </button>
        <button type="button">
          <FontAwesomeIcon icon={faEdit} />
          Edit
        </button>
      </div>
      <button
        type="button"
        className="play"
        onClick={() =>
          fetch(
            `${process.env.REACT_APP_API_URL}/levels/${(view as any).level.id}`
          )
            .then((result) => result.json())
            .then((result) => {
              setView((old) => {
                console.log(result);
                return {
                  view: "gameplay",
                  level: result,
                  version: (old as any).version,
                };
              });
            })
        }
      >
        <FontAwesomeIcon icon={faPlay} />
        Play
      </button>
    </div>
  );
};

export default LevelActions;
