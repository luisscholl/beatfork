import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import GameplayObstacle from './GameplayObstacle';

describe('<GameplayObstacle />', () => {
  test('it should mount', () => {
    render(<GameplayObstacle />);

    const gameplayObstacle = screen.getByTestId('GameplayObstacle');

    expect(gameplayObstacle).toBeInTheDocument();
  });
});
