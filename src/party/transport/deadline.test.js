import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADVANCE_FALLBACK_MS, DEADLINE_MARGIN_MS } from "../config";
import { createClock } from "./clock";
import { createDeadlineTimer } from "./deadline";

describe("deadline timer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = () => {
    const send = vi.fn();
    const clock = createClock();
    clock.sync(Date.now() + 1_000); // server 1s ahead
    return { send, timer: createDeadlineTimer(clock, send), clock };
  };

  it("driver fires advance once at the deadline", () => {
    const { send, timer, clock } = setup();
    timer.arm({ deadline: clock.now() + 5_000, phaseId: 3, driver: true });
    vi.advanceTimersByTime(5_000 + DEADLINE_MARGIN_MS - 1);
    expect(send).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(send).toHaveBeenCalledExactlyOnceWith(3);
  });

  it("non-driver waits an extra 3 seconds", () => {
    const { send, timer, clock } = setup();
    timer.arm({ deadline: clock.now() + 5_000, phaseId: 3, driver: false });
    vi.advanceTimersByTime(5_000 + DEADLINE_MARGIN_MS);
    expect(send).not.toHaveBeenCalled();
    vi.advanceTimersByTime(ADVANCE_FALLBACK_MS);
    expect(send).toHaveBeenCalledWith(3);
  });

  it("a newer phase replaces the pending timer", () => {
    const { send, timer, clock } = setup();
    timer.arm({ deadline: clock.now() + 5_000, phaseId: 3, driver: false });
    vi.advanceTimersByTime(4_000);
    timer.arm({ deadline: clock.now() + 5_000, phaseId: 4, driver: false });
    vi.advanceTimersByTime(20_000);
    expect(send).toHaveBeenCalledExactlyOnceWith(4);
  });

  it("re-arming the same phase and deadline keeps one timer, and null deadline clears it", () => {
    const { send, timer, clock } = setup();
    const deadline = clock.now() + 1_000;
    timer.arm({ deadline, phaseId: 1, driver: true });
    timer.arm({ deadline, phaseId: 1, driver: true });
    vi.advanceTimersByTime(5_000);
    expect(send).toHaveBeenCalledTimes(1);
    timer.arm({ deadline: clock.now() + 1_000, phaseId: 2, driver: true });
    timer.arm({ deadline: null, phaseId: 2, driver: true });
    vi.advanceTimersByTime(5_000);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
