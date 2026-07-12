import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import React, { StrictMode, act } from "react";
import { Client } from "../src/client";
import { decodeMessage, encodeMessage } from "../src/shared/binary-protocol";
import type { Transport } from "../src/shared/types";

interface BinaryEvents {
  readonly __bin__: Uint8Array;
}

interface StatusProps {
  readonly label: string;
}

interface TestTransportHarness {
  readonly transport: Transport<BinaryEvents>;
  readonly listenerCount: () => number;
}

const READY_VIEW_TREE = {
  views: [
    {
      uid: "strict-mode-status",
      name: "Status",
      parentUid: "",
      childIndex: 0,
      isRoot: true,
      props: [{ name: "label", type: "data", data: "ready" }],
    },
  ],
} as const;

function Status({ label }: StatusProps): React.ReactElement {
  return <span>{label}</span>;
}

function dispatchViewTree(
  listeners: ReadonlySet<(data: Uint8Array) => void>,
): void {
  const frame = encodeMessage("update_views_tree", READY_VIEW_TREE);
  listeners.forEach((listener) => listener(frame));
}

function createTestTransport(): TestTransportHarness {
  const listeners = new Set<(data: Uint8Array) => void>();

  return {
    transport: {
      emit: (_event, message) => {
        if (message === undefined) return;
        if (decodeMessage(message).event !== "request_views_tree") return;
        queueMicrotask(() => dispatchViewTree(listeners));
      },
      on: (_event, handler) => {
        listeners.add(handler);
      },
      off: (_event, handler) => {
        listeners.delete(handler);
      },
    },
    listenerCount: () => listeners.size,
  };
}

function waitForMicrotask(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

beforeAll(() => {
  GlobalRegistrator.register();
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    configurable: true,
    value: true,
  });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");
  GlobalRegistrator.unregister();
});

describe("Client", () => {
  test("renders after the StrictMode effect lifecycle probe", async () => {
    const { createRoot } = await import("react-dom/client");
    const container = document.createElement("div");
    const root = createRoot(container);
    const transportHarness = createTestTransport();

    await act(async () => {
      root.render(
        <StrictMode>
          <Client
            transport={transportHarness.transport}
            views={{ Status }}
            requestViewTreeOnMount
          />
        </StrictMode>,
      );
    });
    await act(async () => {
      await waitForMicrotask();
    });

    expect(container.textContent).toBe("ready");
    expect(transportHarness.listenerCount()).toBe(1);

    await act(async () => root.unmount());
    expect(transportHarness.listenerCount()).toBe(0);
  });
});
