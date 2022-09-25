import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import MusicIcon from './MusicIcon';

describe('<MusicIcon />', () => {
  test('it should mount', () => {
    render(<MusicIcon type="quarter-note" />);

    const musicIcon = screen.getByTestId('MusicIcon');

    expect(musicIcon).toBeInTheDocument();
  });
});
