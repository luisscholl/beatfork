import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LevelDifficultyMeta from './LevelDifficultyMeta';

describe('<LevelDifficultyMeta />', () => {
  test('it should mount', () => {
    render(<LevelDifficultyMeta />);

    const levelDifficultyMeta = screen.getByTestId('LevelDifficultyMeta');

    expect(levelDifficultyMeta).toBeInTheDocument();
  });
});
