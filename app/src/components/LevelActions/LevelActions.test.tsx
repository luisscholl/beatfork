import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import LevelActions from "./LevelActions";

describe("<LevelActions />", () => {
  test("it should mount", () => {
    render(<LevelActions />);

    const levelActions = screen.getByTestId("LevelActions");

    expect(levelActions).toBeInTheDocument();
  });
});
