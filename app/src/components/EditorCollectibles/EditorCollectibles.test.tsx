import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import EditorCollectibles from "./EditorCollectibles";

describe("<EditorCollectibles />", () => {
  test("it should mount", () => {
    render(<EditorCollectibles />);

    const EditorCollectibles = screen.getByTestId("EditorCollectibles");

    expect(EditorCollectibles).toBeInTheDocument();
  });
});
