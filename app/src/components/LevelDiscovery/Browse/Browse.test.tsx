import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Browse from './Browse';

describe('<Browse />', () => {
  test('it should mount', () => {
    render(<Browse />);

    const browse = screen.getByTestId('Browse');

    expect(browse).toBeInTheDocument();
  });
});
