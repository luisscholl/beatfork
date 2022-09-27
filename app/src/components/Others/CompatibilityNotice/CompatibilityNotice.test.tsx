import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CompatibilityNotice from './CompatibilityNotice';

describe('<CompatibilityNotice />', () => {
  test('it should mount', () => {
    render(<CompatibilityNotice />);
    
    const compatibilityNotice = screen.getByTestId('CompatibilityNotice');

    expect(compatibilityNotice).toBeInTheDocument();
  });
});