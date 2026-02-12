import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

import { createInitialRoomState } from "../state";
import { runRoomTurnTheatricalV3 } from "./engine";
import type { RoomEngineDepsV3, RoomTurnInputV3, TheatricalBudget } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const loadJson = async (relativePath: string) => {
  const raw = await fs.readFile(path.resolve(repoRoot, relativePath), "utf8");
  return JSON.parse(raw) as unknown;
};

const assertValid = (validate: ValidateFunction, data: unknown, label: string) => {
  if (validate(data)) return;
  const details = (validate.errors || [])
    .map((error) => `${error.instancePath || "/"} ${error.message || "invalid"}`)
    .join("; ");
  throw new Error(`${label} failed validation: ${details}`);
};

const renderTranscript = (events: Array<{ type: string; author: string; content: string }>) => {
  return events
    .map((event) => {
      if (event.type === "speak") return `${event.author}: ${event.content}`;
      if (event.type === "action") return `${event.author} (action): ${event.content}`;
      return `${event.author} (thought): ${event.content}`;
    })
    .join("\n");
};

const makeInput = (budget: TheatricalBudget): RoomTurnInputV3 => ({
  chamberId: "contract-suite",
  userId: "u1",
  userName: "User",
  userTier: "BASE",
  userMessage: "Give one recommendation.",
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
  budget,
  presetId: "balanced",
  presetPrompt: "Balanced tone",
});

describe("v3 canonical schema contracts", () => {
  it("INV-CORE-CONTRACT-SCHEMA fixtures remain valid", async () => {
    const [eventsSchema, runEnvelopeSchema, minimalFixture, fallbackFixture] = await Promise.all([
      loadJson("contracts/theatrical-v3/events.schema.json"),
      loadJson("contracts/theatrical-v3/run-envelope.schema.json"),
      loadJson("contracts/theatrical-v3/fixtures/minimal-turn.json"),
      loadJson("contracts/theatrical-v3/fixtures/fallback-turn.json"),
    ]);

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validateEvents = ajv.compile(eventsSchema as any);
    const validateEnvelope = ajv.compile(runEnvelopeSchema as any);

    assertValid(validateEnvelope, minimalFixture, "minimal fixture envelope");
    assertValid(validateEnvelope, fallbackFixture, "fallback fixture envelope");

    const minimalEvents = (minimalFixture as any)?.output?.events;
    const fallbackEvents = (fallbackFixture as any)?.output?.events;

    assertValid(validateEvents, minimalEvents, "minimal fixture events");
    assertValid(validateEvents, fallbackEvents, "fallback fixture events");
  });

  it("INV-CORE-CONTRACT-SCHEMA model-path runtime output validates", async () => {
    const [eventsSchema, runEnvelopeSchema] = await Promise.all([
      loadJson("contracts/theatrical-v3/events.schema.json"),
      loadJson("contracts/theatrical-v3/run-envelope.schema.json"),
    ]);

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validateEvents = ajv.compile(eventsSchema as any);
    const validateEnvelope = ajv.compile(runEnvelopeSchema as any);

    const initialState = createInitialRoomState();
    let savedState = initialState;

    const budget: TheatricalBudget = {
      maxDirectorAttempts: 2,
      maxActionEventsPerTurn: 1,
      maxThoughtEventsPerTurn: 1,
      maxThoughtCharsPerEvent: 64,
      targetP95TurnLatencyMs: 20_000,
    };

    const deps: RoomEngineDepsV3 = {
      loadState: async () => ({ state: initialState }),
      saveState: async (_chamberId, state) => {
        savedState = state;
      },
      generateText: async (request) => {
        const trace = request.trace?.name || "";
        if (trace.includes("director")) {
          return JSON.stringify({
            beats: [
              {
                agent_id: "r1",
                intent: "respond",
                allow_action: true,
                allow_thought: true,
                tone_hint: "balanced",
                max_events: 2,
              },
            ],
          });
        }
        if (trace.includes("speaker")) {
          return [
            JSON.stringify({ type: "speak", author: "Ava", content: "Primary line", visibility: "public" }),
            JSON.stringify({ type: "action", author: "Ava", content: "Drafts plan", visibility: "public" }),
          ].join("\n");
        }
        return "Summary";
      },
      withTrace: async (_context, _meta, fn) => fn(),
    };

    const result = await runRoomTurnTheatricalV3(deps, makeInput(budget));

    const envelope = {
      schemaVersion: 1,
      status: "ok",
      runId: "runtime-model-path",
      chamberId: "contract-suite",
      mode: "headless",
      startedAt: "2026-02-12T00:00:00.000Z",
      finishedAt: "2026-02-12T00:00:00.900Z",
      durationMs: 900,
      input: {
        prompt: "Give one recommendation.",
        presetId: "balanced",
        fixtureMode: "replay",
        roomieIds: ["r1"],
        modelConfig: {
          defaultAgentModel: "test/agent",
          directorModel: "test/director",
          summarizerModel: "test/summarizer",
        },
      },
      output: {
        events: result.events,
        transcript: renderTranscript(result.events),
        directorPlan: result.directorPlan,
        stateRef: {
          chamberId: "contract-suite",
          turnIndex: result.state.shared.turn_index,
        },
      },
      metrics: {
        eventCounts: {
          speak: result.events.filter((event) => event.type === "speak").length,
          action: result.events.filter((event) => event.type === "action").length,
          thought: result.events.filter((event) => event.type === "thought").length,
        },
        totalEvents: result.events.length,
        directorAttempts: result.directorPlan.trace.attempts,
        directorSource: result.directorPlan.trace.source,
        turnIndexBefore: 0,
        turnIndexAfter: result.state.shared.turn_index,
        latencyMs: 900,
      },
    };

    assertValid(validateEvents, result.events, "model-path events");
    assertValid(validateEnvelope, envelope, "model-path envelope");
    expect(savedState.runtime.theatrical_contract_version).toBe(1);
  });

  it("INV-CORE-CONTRACT-SCHEMA fallback-path runtime output validates", async () => {
    const [eventsSchema, runEnvelopeSchema] = await Promise.all([
      loadJson("contracts/theatrical-v3/events.schema.json"),
      loadJson("contracts/theatrical-v3/run-envelope.schema.json"),
    ]);

    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validateEvents = ajv.compile(eventsSchema as any);
    const validateEnvelope = ajv.compile(runEnvelopeSchema as any);

    const initialState = createInitialRoomState();

    const budget: TheatricalBudget = {
      maxDirectorAttempts: 1,
      maxActionEventsPerTurn: 1,
      maxThoughtEventsPerTurn: 1,
      maxThoughtCharsPerEvent: 64,
      targetP95TurnLatencyMs: 20_000,
    };

    const deps: RoomEngineDepsV3 = {
      loadState: async () => ({ state: initialState }),
      saveState: async () => {},
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

    const result = await runRoomTurnTheatricalV3(deps, makeInput(budget));

    const envelope = {
      schemaVersion: 1,
      status: "ok",
      runId: "runtime-fallback-path",
      chamberId: "contract-suite",
      mode: "headless",
      startedAt: "2026-02-12T00:00:10.000Z",
      finishedAt: "2026-02-12T00:00:10.800Z",
      durationMs: 800,
      input: {
        prompt: "Give one recommendation.",
        presetId: "balanced",
        fixtureMode: "replay",
        roomieIds: ["r1"],
        modelConfig: {
          defaultAgentModel: "test/agent",
          directorModel: "test/director",
          summarizerModel: "test/summarizer",
        },
      },
      output: {
        events: result.events,
        transcript: renderTranscript(result.events),
        directorPlan: result.directorPlan,
        stateRef: {
          chamberId: "contract-suite",
          turnIndex: result.state.shared.turn_index,
        },
      },
      metrics: {
        eventCounts: {
          speak: result.events.filter((event) => event.type === "speak").length,
          action: result.events.filter((event) => event.type === "action").length,
          thought: result.events.filter((event) => event.type === "thought").length,
        },
        totalEvents: result.events.length,
        directorAttempts: result.directorPlan.trace.attempts,
        directorSource: result.directorPlan.trace.source,
        turnIndexBefore: 0,
        turnIndexAfter: result.state.shared.turn_index,
        latencyMs: 800,
      },
    };

    assertValid(validateEvents, result.events, "fallback-path events");
    assertValid(validateEnvelope, envelope, "fallback-path envelope");
    expect(result.directorPlan.trace.source).toBe("fallback");
  });
});
