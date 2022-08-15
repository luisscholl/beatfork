import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LevelDifficulty from './LevelDifficulty';

describe('<LevelDifficulty />', () => {
  test('it should mount', () => {
    render(<LevelDifficulty />);

    const levelDifficulty = screen.getByTestId('LevelDifficulty');

    expect(levelDifficulty).toBeInTheDocument();
  });
});
