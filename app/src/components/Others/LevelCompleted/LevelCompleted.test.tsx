import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LevelCompleted from './LevelCompleted';

describe('<LevelCompleted />', () => {
  test('it should mount', () => {
    render(<LevelCompleted />);

    const levelCompleted = screen.getByTestId('LevelCompleted');

    expect(levelCompleted).toBeInTheDocument();
  });
});
