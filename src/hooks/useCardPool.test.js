import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCardPool } from "./useCardPool";

describe("useCardPool", () => {
  it("draws every card exactly once without replacement", () => {
    const { result } = renderHook(() => useCardPool(["a", "b", "c"]));

    const drawn = new Set();
    act(() => drawn.add(result.current.draw()));
    act(() => drawn.add(result.current.draw()));
    act(() => drawn.add(result.current.draw()));

    expect(drawn).toEqual(new Set(["a", "b", "c"]));
    expect(result.current.isEmpty).toBe(true);
  });

  it("returns undefined once the pool is exhausted", () => {
    const { result } = renderHook(() => useCardPool(["only"]));

    act(() => result.current.draw());
    let extra;
    act(() => {
      extra = result.current.draw();
    });

    expect(extra).toBeUndefined();
  });

  it("resets the pool when the initial cards prop changes", () => {
    const { result, rerender } = renderHook(({ cards }) => useCardPool(cards), {
      initialProps: { cards: ["a"] },
    });

    act(() => result.current.draw());
    expect(result.current.isEmpty).toBe(true);

    rerender({ cards: ["x", "y"] });
    expect(result.current.pool).toEqual(["x", "y"]);
  });
});
