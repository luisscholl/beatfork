import React from "react";
import { useRecoilValue } from "recoil";
import { viewState } from "../../atoms/viewState";
import Level from "../../models/Level";
import "./LevelMeta.scss";

const LevelMeta = () => {
  const view = useRecoilValue(viewState);

  if (typeof (view as any).level === "undefined") return null;

  const _level = (view as any).level as Level;

  return (
    <div className="LevelMeta" data-testid="LevelMeta">
      <h2>{_level.title}</h2>
      <h3>
        <span>
          Artist<small>(s)</small>
        </span>
        <span>{_level.artists.map((artist) => artist.name).join("\n")}</span>
      </h3>
      <h3>
        <span>Author</span>
        <span>{_level.author.username}</span>
      </h3>
      <h3>
        <span>BPM</span>
        <span>{_level.bpm}</span>
      </h3>
      <h3>
        <span>Length</span>
        <span>{`${Math.floor(_level.length / 60)}:${_level.length % 60}`}</span>
      </h3>
    </div>
  );
};

export default LevelMeta;
