import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Preview from "./Preview";

describe("<Preview />", () => {
  test("it should mount", () => {
    render(<Preview />);

    const preview = screen.getByTestId("Preview");

    expect(preview).toBeInTheDocument();
  });
});
