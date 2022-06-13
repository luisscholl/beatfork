import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import EditorSideBarCollectible from "./EditorSideBarCollectible";
import { CollectibleType } from "../../models/Collectible";

describe("<EditorSideBarCollectible />", () => {
  test("it should mount", () => {
    render(<EditorSideBarCollectible type={CollectibleType.All} />);

    const editorSideBarCollectible = screen.getByTestId(
      "EditorSideBarCollectible"
    );

    expect(editorSideBarCollectible).toBeInTheDocument();
  });
});
