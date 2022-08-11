import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import EditorObstacles from "./EditorObstacles";

describe("<EditorObstacles />", () => {
  test("it should mount", () => {
    render(<EditorObstacles />);

    const editorObstacles = screen.getByTestId("EditorObstacles");

    expect(editorObstacles).toBeInTheDocument();
  });
});
