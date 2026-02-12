import { describe, expect, it } from "vitest";

import { createInitialRoomState } from "../state";
import { runRoomTurnTheatricalV3 } from "./engine";
import type { RoomEngineDepsV3, RoomTurnInputV3, TheatricalBudget } from "./types";

const baseBudget = (overrides?: Partial<TheatricalBudget>): TheatricalBudget => ({
  maxDirectorAttempts: 1,
  maxActionEventsPerTurn: 1,
  maxThoughtEventsPerTurn: 1,
  maxThoughtCharsPerEvent: 64,
  targetP95TurnLatencyMs: 20_000,
  ...overrides,
});

const makeInput = (budget?: TheatricalBudget): RoomTurnInputV3 => ({
  chamberId: "test-chamber",
  userId: "u1",
  userName: "User",
  userTier: "BASE",
  userMessage: "What should we do next?",
  chamberGoal: "Ship reliable features",
  roomies: [
    {
      id: "r1",
      name: "Ava",
      bio: "Strategist",
    },
  ],
  defaultAgentModel: "test/agent",
  directorModel: "test/director",
  summarizerModel: "test/summarizer",
  budget: budget || baseBudget(),
  presetId: "balanced",
  presetPrompt: "Balanced tone",
});

describe("v3 engine contract", () => {
  it("falls back to a valid director plan when director output is invalid", async () => {
    const initialState = createInitialRoomState();
    let savedState = initialState;

    const deps: RoomEngineDepsV3 = {
      loadState: async () => ({ state: initialState }),
      saveState: async (_chamberId, state) => {
        savedState = state;
      },
      generateText: async (request) => {
        const trace = request.trace?.name || "";
        if (trace.includes("director")) {
          return "not-json";
        }
        if (trace.includes("speaker")) {
          return JSON.stringify({
            type: "speak",
            author: "Ava",
            content: "Fallback output",
            visibility: "public",
            intensity: 2,
          });
        }
        return "Summary";
      },
      withTrace: async (_context, _meta, fn) => fn(),
    };

    const result = await runRoomTurnTheatricalV3(deps, makeInput(baseBudget({ maxDirectorAttempts: 1 })));

    expect(result.directorPlan.trace.source).toBe("fallback");
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events[0]?.type).toBe("speak");
    expect(savedState.runtime.theatrical_contract_version).toBe(1);
  });

  it("uses director repair path when second attempt returns valid plan", async () => {
    const initialState = createInitialRoomState();
    let directorCalls = 0;

    const deps: RoomEngineDepsV3 = {
      loadState: async () => ({ state: initialState }),
      saveState: async () => {
        // no-op
      },
      generateText: async (request) => {
        const trace = request.trace?.name || "";
        if (trace === "room-v3.director") {
          directorCalls += 1;
          return "bad-director-output";
        }
        if (trace === "room-v3.director-repair") {
          directorCalls += 1;
          return JSON.stringify({
            beats: [
              {
                agent_id: "r1",
                intent: "respond",
                allow_action: false,
                allow_thought: false,
                tone_hint: "balanced",
                max_events: 1,
              },
            ],
          });
        }
        if (trace.includes("speaker")) {
          return JSON.stringify({
            type: "speak",
            author: "Ava",
            content: "Repair path output",
            visibility: "public",
            intensity: 2,
          });
        }
        return "Summary";
      },
      withTrace: async (_context, _meta, fn) => fn(),
    };

    const result = await runRoomTurnTheatricalV3(deps, makeInput(baseBudget({ maxDirectorAttempts: 2 })));

    expect(directorCalls).toBe(2);
    expect(result.directorPlan.trace.source).toBe("repair");
    expect(result.directorPlan.trace.attempts).toBe(2);
    expect(result.directorPlan.beats[0]?.agentId).toBe("r1");
  });
});
