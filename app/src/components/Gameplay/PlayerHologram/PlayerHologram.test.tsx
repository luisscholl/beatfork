import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import PlayerHologram from './PlayerHologram';

describe('<PlayerHologram />', () => {
  test('it should mount', () => {
    render(<PlayerHologram />);

    const playerHologram = screen.getByTestId('PlayerHologram');

    expect(playerHologram).toBeInTheDocument();
  });
});
