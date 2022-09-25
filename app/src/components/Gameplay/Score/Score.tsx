import React from 'react';
import './Score.scss';

const Score = (props: { score: number; multiplier: number }) => {
  const { round } = Math;

  return (
    <div className="Score" data-testid="Score">
      <p className="multiplier">{round(props.multiplier * 100) / 100}X</p>
      <p className="score">{props.score}</p>
    </div>
  );
};

export default Score;
