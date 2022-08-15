import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import ProgressIndicator from './ProgressIndicator';

describe('<ProgressIndicator />', () => {
  test('it should mount', () => {
    render(<ProgressIndicator max={100} />);

    const progressIndicator = screen.getByTestId('ProgressIndicator');

    expect(progressIndicator).toBeInTheDocument();
  });
});
