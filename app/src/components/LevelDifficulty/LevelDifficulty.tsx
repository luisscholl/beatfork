import React from "react";
import { useRecoilState } from "recoil";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretLeft } from "@fortawesome/free-solid-svg-icons";
import { viewState } from "../../atoms/viewState";
import LevelVersionPartial from "../../models/LevelVersionPartial";
import "./LevelDifficulty.scss";
import Level from "../../models/Level";
import LevelPartial from "../../models/LevelPartial";

const LevelDifficulty = () => {
  const [view, setView] = useRecoilState(viewState);

  if (!(view as any).level) return null;
  if (!(view as any).version)
    setView((old) => {
      return {
        ...old,
        version: ((view as any).level as LevelPartial | Level).versions[0].id,
      };
    });

  let _versions = Object.values(
    JSON.parse(JSON.stringify((view as any).level.versions)) as {
      [key: string]: LevelVersionPartial;
    }
  );
  _versions = _versions.sort((a, b) => a.difficulty - b.difficulty);

  return (
    <div className="LevelDifficulty" data-testid="LevelDifficulty">
      {_versions.map((version) => (
        <div
          key={version.id}
          className={`row-wrapper ${
            (view as any).version === version.id ? "active" : ""
          }`}
        >
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
            <FontAwesomeIcon icon={faCaretLeft} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LevelDifficulty;
