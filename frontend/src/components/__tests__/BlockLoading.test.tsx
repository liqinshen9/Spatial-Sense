import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BlockLoading from "../BlockLoading";

describe("BlockLoading", () => {
  it("renders the loading label", () => {
    render(<BlockLoading label="Loading puzzle..." />);

    expect(screen.getByText(/loading puzzle/i)).toBeInTheDocument();
  });

  it("renders 9 animated loading blocks", () => {
    const { container } = render(<BlockLoading label="" />);

    const blocks = container.querySelectorAll(".block-loading-grid span");

    expect(blocks).toHaveLength(9);
  });

  it("supports different sizes", () => {
    const { container } = render(<BlockLoading size="lg" label="" />);

    expect(container.querySelector(".block-loading-lg")).toBeInTheDocument();
  });
});