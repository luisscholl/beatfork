import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import GameOver from './GameOver';

describe('<GameOver />', () => {
  test('it should mount', () => {
    render(<GameOver />);

    const gameOver = screen.getByTestId('GameOver');

    expect(gameOver).toBeInTheDocument();
  });
});
