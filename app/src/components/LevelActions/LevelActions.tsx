import React from "react";
import { useRecoilState } from "recoil";
import { viewState } from "../../atoms/viewState";
import "./LevelActions.scss";

const LevelActions = () => {
  const [view, setView] = useRecoilState(viewState);

  if (!(view as any).level) return null;

  return (
    <div className="LevelActions" data-testid="LevelActions">
      <div className="columns">
        <button type="button">Add to playlist</button>
        <button type="button">Edit</button>
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
        Play
      </button>
    </div>
  );
};

export default LevelActions;
