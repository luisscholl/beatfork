import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import SettingsRow from './SettingsRow';

describe('<SettingsRow />', () => {
  test('it should mount', () => {
    render(<SettingsRow />);
    
    const settingsRow = screen.getByTestId('SettingsRow');

    expect(settingsRow).toBeInTheDocument();
  });
});