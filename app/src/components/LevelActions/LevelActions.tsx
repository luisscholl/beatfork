import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useRecoilState } from "recoil";
import { faEdit, faList, faPlay } from "@fortawesome/free-solid-svg-icons";
import { viewState } from "../../atoms/viewState";
import "./LevelActions.scss";

const LevelActions = () => {
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
          setView({
            view: "gameplay",
            level: (view as any).level,
            version: (view as any).version,
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
