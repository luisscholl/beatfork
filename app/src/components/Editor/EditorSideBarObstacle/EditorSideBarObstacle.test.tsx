import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import EditorSideBarObstacle from './EditorSideBarObstacle';

describe('<EditorSideBarObstacle />', () => {
  test('it should mount', () => {
    render(<EditorSideBarObstacle />);

    const editorSideBarObstacle = screen.getByTestId('EditorSideBarObstacle');

    expect(editorSideBarObstacle).toBeInTheDocument();
  });
});
