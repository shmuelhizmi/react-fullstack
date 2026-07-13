import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import React, { StrictMode, act } from "react";
import { Client, type ClientViewsState } from "../src/client";
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
  readonly dispatch: (frame: Uint8Array) => void;
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
  const dispatch = (frame: Uint8Array): void => {
    listeners.forEach((listener) => listener(frame));
  };

  return {
    transport: {
      emit: (_event, message) => {
        if (message === undefined) return;
        if (decodeMessage(message).event !== "request_views_tree") return;
        queueMicrotask(() => dispatch(encodeMessage("update_views_tree", READY_VIEW_TREE)));
      },
      on: (_event, handler) => {
        listeners.add(handler);
      },
      off: (_event, handler) => {
        listeners.delete(handler);
      },
    },
    listenerCount: () => listeners.size,
    dispatch,
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

  test("reports an empty snapshot before a widget gains renderable views", async () => {
    const { createRoot } = await import("react-dom/client");
    const container = document.createElement("div");
    const root = createRoot(container);
    const transportHarness = createTestTransport();
    const states = new Set<ClientViewsState>();

    await act(async () => {
      root.render(
        <Client
          transport={transportHarness.transport}
          views={{ Status }}
          onViewsChange={(state) => states.add(state)}
        />,
      );
    });
    await act(async () => {
      transportHarness.dispatch(encodeMessage("update_views_tree", { views: [] }));
    });

    expect([...states].at(-1)).toEqual({ views: [], hasReceivedViewTree: true });
    expect(container.textContent).toBe("");

    await act(async () => {
      transportHarness.dispatch(encodeMessage("update_views_tree", READY_VIEW_TREE));
    });

    expect([...states].at(-1)).toEqual({
      views: READY_VIEW_TREE.views,
      hasReceivedViewTree: true,
    });
    expect(container.textContent).toBe("ready");

    await act(async () => root.unmount());
  });
});
