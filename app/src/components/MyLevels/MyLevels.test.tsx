import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import MyLevels from "./MyLevels";

describe("<MyLevels />", () => {
  test("it should mount", () => {
    render(<MyLevels />);

    const myLevels = screen.getByTestId("MyLevels");

    expect(myLevels).toBeInTheDocument();
  });
});
