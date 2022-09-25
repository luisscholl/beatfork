import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DifficultyAnnotator from './DifficultyAnnotator';

describe('<DifficultyAnnotator />', () => {
  test('it should mount', () => {
    render(<DifficultyAnnotator />);

    const difficultyAnnotator = screen.getByTestId('DifficultyAnnotator');

    expect(difficultyAnnotator).toBeInTheDocument();
  });
});
