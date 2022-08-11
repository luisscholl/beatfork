import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import LevelList from "./LevelList";

describe("<LevelList />", () => {
  test("it should mount", () => {
    render(<LevelList />);

    const levelList = screen.getByTestId("LevelList");

    expect(levelList).toBeInTheDocument();
  });
});
