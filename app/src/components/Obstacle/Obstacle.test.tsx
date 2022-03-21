import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Obstacle from "./Obstacle";

describe("<Obstacle />", () => {
  test("it should mount", () => {
    render(<Obstacle />);

    const obstacle = screen.getByTestId("Obstacle");

    expect(obstacle).toBeInTheDocument();
  });
});
