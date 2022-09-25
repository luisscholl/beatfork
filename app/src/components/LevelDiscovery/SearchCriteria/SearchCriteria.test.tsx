import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import SearchCriteria from './SearchCriteria';

describe('<SearchCriteria />', () => {
  test('it should mount', () => {
    render(<SearchCriteria />);

    const searchCriteria = screen.getByTestId('SearchCriteria');

    expect(searchCriteria).toBeInTheDocument();
  });
});
