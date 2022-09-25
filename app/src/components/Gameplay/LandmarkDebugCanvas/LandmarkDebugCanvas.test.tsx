import React, { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LandmarkDebugCanvas from './LandmarkDebugCanvas';

describe('<LandmarkDebugCanvas />', () => {
  const ref = useRef(null);
  test('it should mount', () => {
    render(<LandmarkDebugCanvas ref={ref} />);

    const landmarkDebugCanvas = screen.getByTestId('LandmarkDebugCanvas');

    expect(landmarkDebugCanvas).toBeInTheDocument();
  });
});
