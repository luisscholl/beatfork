import React, { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { viewState } from '../../atoms/viewState';
import './LevelCompleted.scss';

interface LevelCompletedProps {}

const LevelCompleted: FC<LevelCompletedProps> = () => {
  const { levelId, versionId } = useParams();
  const view = useRecoilValue(viewState);

  return (
    <div className="LevelCompleted" data-testid="LevelCompleted">
      <div>
        <p className="level-completed">LEVEL COMPLETED!</p>
        <p className="end-score">{(view as any).score} Points</p>
      </div>
      <Link to={`/gameplay/${levelId}/${versionId}`}>Play again!</Link>
      <Link to={view.returnView}>Return</Link>
    </div>
  );
};

export default LevelCompleted;
