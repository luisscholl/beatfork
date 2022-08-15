import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Ground from './Ground';

describe('<Ground />', () => {
  test('it should mount', () => {
    render(<Ground />);

    const ground = screen.getByTestId('Ground');

    expect(ground).toBeInTheDocument();
  });
});
