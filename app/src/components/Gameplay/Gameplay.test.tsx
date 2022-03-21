import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Gameplay from "./Gameplay";

describe("<Gameplay />", () => {
  test("it should mount", () => {
    render(<Gameplay />);

    const gameplay = screen.getByTestId("Gameplay");

    expect(gameplay).toBeInTheDocument();
  });
});
