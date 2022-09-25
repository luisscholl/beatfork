import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import GameplayCollectibles from './GameplayCollectibles';

describe('<GameplayCollectibles />', () => {
  test('it should mount', () => {
    render(<GameplayCollectibles />);

    const gameplayCollectibles = screen.getByTestId('GameplayCollectibles');

    expect(gameplayCollectibles).toBeInTheDocument();
  });
});
