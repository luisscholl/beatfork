import React, { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DifficultyAnnotatorObstacles from './DifficultyAnnotatorObstacles';

describe('<EditorObstacles />', () => {
  const selected = useRef();

  test('it should mount', () => {
    render(
      <DifficultyAnnotatorObstacles
        triggerSelectLevelObject={() => {
          console.log('test');
        }}
        obstaclesResizeFlag={null}
        selected={selected}
      />
    );

    const editorObstacles = screen.getByTestId('DifficultyAnnotatorObstacles');

    expect(editorObstacles).toBeInTheDocument();
  });
});
