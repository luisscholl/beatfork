import React, { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { viewState } from '../../../atoms/viewState';
import './GameOver.scss';

interface GameOverProps {}

const GameOver: FC<GameOverProps> = () => {
  const { levelId, versionId } = useParams();
  const [view, setView] = useRecoilState(viewState);

  return (
    <div className="GameOver" data-testid="GameOver">
      <p>GAME OVER</p>
      <Link to={`/gameplay/${levelId}/${versionId}`}>Try again!</Link>
      <Link to={view.returnView}>Return</Link>
    </div>
  );
};

export default GameOver;
