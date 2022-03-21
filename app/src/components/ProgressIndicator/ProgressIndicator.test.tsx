import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import ProgressIndicator from "./ProgressIndicator";

describe("<ProgressIndicator />", () => {
  test("it should mount", () => {
    render(<ProgressIndicator />);

    const ProgressIndicator = screen.getByTestId("ProgressIndicator");

    expect(ProgressIndicator).toBeInTheDocument();
  });
});
