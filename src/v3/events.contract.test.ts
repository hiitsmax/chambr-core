import { describe, expect, it } from "vitest";

import { applyBudgetCaps, parseNdjsonTheatricalEvents } from "./events";
import type { TheatricalBudget, TheatricalEvent } from "./types";

const budget: TheatricalBudget = {
  maxDirectorAttempts: 1,
  maxActionEventsPerTurn: 1,
  maxThoughtEventsPerTurn: 1,
  maxThoughtCharsPerEvent: 12,
  targetP95TurnLatencyMs: 20_000,
};

describe("v3 events contract", () => {
  it("sanitizes parsed NDJSON events into stable theatrical fields", () => {
    let counter = 0;
    const parsed = parseNdjsonTheatricalEvents({
      raw: [
        JSON.stringify({ type: "speak", author: "Ava", content: "Hello", intensity: "9" }),
        JSON.stringify({ type: "thought", author: "Ava", content: "  private line  ", visibility: "public" }),
      ].join("\n"),
      defaultAuthor: "Fallback",
      defaultBeatId: "b1-1",
      origin: "roomie",
      nextEventId: () => `e${++counter}`,
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[0]).toMatchObject({
      type: "speak",
      author: "Ava",
      eventId: "e1",
      beatId: "b1-1",
      schemaVersion: 1,
      origin: "roomie",
      intensity: 5,
    });
    expect(parsed.events[1]).toMatchObject({
      type: "thought",
      eventId: "e2",
      visibility: "public",
      origin: "roomie",
    });
  });

  it("rejects invalid event records", () => {
    const parsed = parseNdjsonTheatricalEvents({
      raw: JSON.stringify({ type: "invalid", content: "nope" }),
      defaultAuthor: "Fallback",
      defaultBeatId: "b1-1",
      nextEventId: () => "e1",
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.reason).toBe("invalid-type");
  });

  it("caps actions/thoughts and clips thought content by budget", () => {
    const events: TheatricalEvent[] = [
      {
        type: "speak",
        author: "Ava",
        content: "Public message",
        eventId: "e1",
        beatId: "b1-1",
        schemaVersion: 1,
        visibility: "public",
        intensity: 2,
        origin: "roomie",
      },
      {
        type: "action",
        author: "Ava",
        content: "Open roadmap",
        eventId: "e2",
        beatId: "b1-1",
        schemaVersion: 1,
        visibility: "public",
        intensity: 2,
        origin: "roomie",
      },
      {
        type: "action",
        author: "Ava",
        content: "Open roadmap",
        eventId: "e3",
        beatId: "b1-1",
        schemaVersion: 1,
        visibility: "public",
        intensity: 2,
        origin: "roomie",
      },
      {
        type: "thought",
        author: "Ava",
        content: "This thought should be clipped heavily",
        eventId: "e4",
        beatId: "b1-1",
        schemaVersion: 1,
        visibility: "private",
        intensity: 2,
        origin: "roomie",
      },
    ];

    const capped = applyBudgetCaps(events, budget);

    expect(capped.filter((event) => event.type === "action")).toHaveLength(1);
    expect(capped.filter((event) => event.type === "thought")).toHaveLength(1);
    expect(capped.find((event) => event.type === "thought")?.content.length).toBeLessThanOrEqual(12);
  });
});
