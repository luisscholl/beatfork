import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import EditorObstacle from "./EditorObstacle";

describe("<EditorObstacle />", () => {
  test("it should mount", () => {
    render(<EditorObstacle />);

    const editorObstacle = screen.getByTestId("EditorObstacle");

    expect(editorObstacle).toBeInTheDocument();
  });
});
