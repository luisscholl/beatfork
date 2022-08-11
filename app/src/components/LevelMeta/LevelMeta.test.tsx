import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import LevelMeta from "./LevelMeta";

describe("<LevelMeta />", () => {
  test("it should mount", () => {
    render(<LevelMeta />);

    const levelMeta = screen.getByTestId("LevelMeta");

    expect(levelMeta).toBeInTheDocument();
  });
});
