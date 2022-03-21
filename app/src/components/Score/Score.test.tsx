import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Score from "./Score";

describe("<Score />", () => {
  test("it should mount", () => {
    render(<Score score={0} multiplier={1} />);

    const score = screen.getByTestId("Score");

    expect(score).toBeInTheDocument();
  });
});
