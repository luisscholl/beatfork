import React, { FC } from "react";
import { Link } from "react-router-dom";
import { useRecoilState } from "recoil";
import { viewState } from "../../atoms/viewState";
import "./LevelCompleted.scss";

interface LevelCompletedProps {}

const LevelCompleted: FC<LevelCompletedProps> = () => {
  const [view, setView] = useRecoilState(viewState);

  return (
    <div className="LevelCompleted" data-testid="LevelCompleted">
      <div className="level-completed">LEVEL COMPLETED!</div>
      <div className="end-score">{(view as any).score} Points</div>
      <Link to={`/gameplay/${view.level.id}/${view.version}`}>Play again!</Link>
      <Link to={view.returnView}>Return</Link>
    </div>
  );
};

export default LevelCompleted;
