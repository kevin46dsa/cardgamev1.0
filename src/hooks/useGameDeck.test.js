import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useGameDeck } from "./useGameDeck";

vi.mock("../Utils/Basic", () => ({
  fetchGame: vi.fn().mockResolvedValue({
    truth: ["truth prompt"],
    Dare: ["dare prompt"],
  }),
}));

describe("useGameDeck", () => {
  it("picks a message from the requested field", async () => {
    const { result } = renderHook(() => useGameDeck("TruthorDare"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.pick("Dare"));
    expect(result.current.message).toBe("dare prompt");

    act(() => result.current.pick("truth"));
    expect(result.current.message).toBe("truth prompt");
  });

  it("ignores a pick on a field with no data", async () => {
    const { result } = renderHook(() => useGameDeck("TruthorDare"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.pick("missingField"));
    expect(result.current.message).toBe("");
  });
});
