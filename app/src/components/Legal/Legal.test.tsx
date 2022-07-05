import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Legal from './Legal';

describe('<Legal />', () => {
  test('it should mount', () => {
    render(<Legal />);
    
    const legal = screen.getByTestId('Legal');

    expect(legal).toBeInTheDocument();
  });
});