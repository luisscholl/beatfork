import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import HealthBar from "./HealthBar";

describe("<HealthBar />", () => {
  test("it should mount", () => {
    render(<HealthBar />);

    const healthBar = screen.getByTestId("HealthBar");

    expect(healthBar).toBeInTheDocument();
  });
});
