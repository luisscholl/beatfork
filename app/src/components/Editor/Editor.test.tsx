import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Editor from "./Editor";

describe("<Editor />", () => {
  test("it should mount", () => {
    render(<Editor />);

    const editor = screen.getByTestId("Editor");

    expect(editor).toBeInTheDocument();
  });
});
