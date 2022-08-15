import React, { FC } from 'react';
import { Link } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { viewState } from '../../atoms/viewState';
import './GameOver.scss';

interface GameOverProps {}

const GameOver: FC<GameOverProps> = () => {
  const [view, setView] = useRecoilState(viewState);

  return (
    <div className="GameOver" data-testid="GameOver">
      <div className="game-over">GAME OVER</div>
      <Link to={`/gameplay/${view.level.id}/${view.version}`}>Try again!</Link>
      <Link to={view.returnView}>Return</Link>
    </div>
  );
};

export default GameOver;
