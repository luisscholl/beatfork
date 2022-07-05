import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LazyMarkdown from './LazyMarkdown';

describe('<LazyMarkdown />', () => {
  test('it should mount', () => {
    render(<LazyMarkdown />);
    
    const lazyMarkdown = screen.getByTestId('LazyMarkdown');

    expect(lazyMarkdown).toBeInTheDocument();
  });
});