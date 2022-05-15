import React from "react";
import { useRecoilState } from "recoil";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretLeft } from "@fortawesome/free-solid-svg-icons";
import { viewState } from "../../atoms/viewState";
import LevelVersionPartial from "../../models/LevelVersionPartial";
import "./LevelDifficulty.scss";

const LevelDifficulty = () => {
  const [view, setView] = useRecoilState(viewState);

  if (!(view as any).level) return null;

  let _versions = JSON.parse(
    JSON.stringify((view as any).level.versions)
  ) as LevelVersionPartial[];
  _versions = _versions.sort((a, b) => a.difficulty - b.difficulty);

  return (
    <div className="LevelDifficulty" data-testid="LevelDifficulty">
      {_versions.map((version) => (
        <>
          <button
            type="button"
            onClick={() => setView({ ...view, version: version.id } as any)}
            className={`number difficulty${version.difficulty}`}
          >
            {version.difficulty}
          </button>
          <button
            type="button"
            onClick={() => setView({ ...view, version: version.id } as any)}
            className="boxes"
          >
            {Array.from({ length: 20 }, (v, k) => (
              <span
                className={
                  k < version.difficulty
                    ? `difficulty${version.difficulty}`
                    : "grey"
                }
              />
            ))}
          </button>
          <div className="icon-wrapper">
            {(view as any).version === version.id && (
              <FontAwesomeIcon icon={faCaretLeft} />
            )}
          </div>
        </>
      ))}
    </div>
  );
};

export default LevelDifficulty;
