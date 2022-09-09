import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CloseAccount from './CloseAccount';

describe('<CloseAccount />', () => {
  test('it should mount', () => {
    render(<CloseAccount />);

    const closeAccount = screen.getByTestId('CloseAccount');

    expect(closeAccount).toBeInTheDocument();
  });
});
