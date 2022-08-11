import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Credits from "./Credits";

describe("<Credits />", () => {
  test("it should mount", () => {
    render(<Credits />);

    const credits = screen.getByTestId("Credits");

    expect(credits).toBeInTheDocument();
  });
});
