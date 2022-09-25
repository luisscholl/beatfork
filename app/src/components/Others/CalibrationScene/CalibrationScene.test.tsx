import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CalibrationScene from './CalibrationScene';

describe('<CalibrationScene />', () => {
  test('it should mount', () => {
    render(<CalibrationScene />);

    const calibrationScene = screen.getByTestId('CalibrationScene');

    expect(calibrationScene).toBeInTheDocument();
  });
});
