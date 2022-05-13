import React from "react";
import { useRecoilValue } from "recoil";
import { viewState } from "../../atoms/viewState";
import LevelVersionPartial from "../../models/LevelVersionPartial";
import "./LevelDifficulty.scss";

const LevelDifficulty = () => {
  const view = useRecoilValue(viewState);

  if (!(view as any).level) return null;

  let _versions = JSON.parse(
    JSON.stringify((view as any).level.versions)
  ) as LevelVersionPartial[];
  _versions = _versions.sort((a, b) => a.difficulty - b.difficulty);

  return (
    <div className="LevelDifficulty" data-testid="LevelDifficulty">
      {_versions.map((version) => (
        <div key={version.id}>
          {Array.from({ length: 20 }, (v, k) => (
            <span
              className={
                k < version.difficulty
                  ? `difficulty${version.difficulty}`
                  : "grey"
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default LevelDifficulty;
