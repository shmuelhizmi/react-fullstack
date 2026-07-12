/**
 * Protocol-level integration test for the view-sync handshake.
 *
 * A client that has connected but not yet requested the view tree has no base
 * state. If the server broadcasts an incremental `update_view` prop diff to such
 * a client, the client materializes the unknown view from the diff alone —
 * producing a view with only the changed props (no callbacks, no other data)
 * and crashing the client renderer on the first missing-prop access.
 *
 * These tests pin the invariant: view-state events (`update_view`,
 * `delete_view`) are only sent to clients that have completed the
 * `request_views_tree` handshake, while the snapshot itself carries full props
 * (data and event props alike).
 */
import { describe, test, expect, afterAll } from "bun:test";
import type { ServerWebSocket } from "bun";
import React from "react";
import { view, callback, passthrough } from "../src/shared/view-builder";
import { Server, type ServerProps } from "../src/server/Server";
import { Render } from "@playfast/echoform-render";
import { decodeMessage, encodeMessage } from "../src/shared/binary-protocol";
import { createWebSocketTransport } from "../src/shared/transport-handlers";
import type { Transport } from "../src/shared/types";

const TEST_TOKEN = "test-handshake-token";

const TestView = view("HandshakeTestView", {
  input: { label: passthrough<string>() },
  callbacks: { onSelect: callback({ input: passthrough<string>() }) },
});

interface ViewProp {
  readonly name: string;
  readonly type: "data" | "event" | "stream";
  readonly data?: unknown;
}

interface UpdateViewPayload {
  readonly view: {
    readonly uid: string;
    readonly name: string;
    readonly props: {
      readonly create: ReadonlyArray<ViewProp>;
      readonly delete: ReadonlyArray<string>;
    };
  };
}

interface TreePayload {
  readonly views: ReadonlyArray<{
    readonly uid: string;
    readonly name: string;
    readonly props: ReadonlyArray<ViewProp>;
  }>;
}

interface ServerHandle {
  readonly port: number;
  readonly setLabel: (label: string) => void;
  readonly stop: () => void;
}

async function waitFor(predicate: () => boolean, description: string, timeoutMs = 5000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${description}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

interface SocketData {
  readonly id: string;
}

type IncomingConnection = Transport<Record<string, unknown>> & { readonly id: string };

function createTestServer(): ServerHandle {
  interface ClientEntry {
    readonly dispatch: (msg: string | ArrayBuffer | Uint8Array) => void;
    readonly disconnect: () => void;
  }

  const clients = new Map<string, ClientEntry>();
  const connectionRef: { current: ((client: IncomingConnection) => void) | null } = { current: null };

  const serverTransport = {
    on: (_event: "connection", handler: (client: IncomingConnection) => void) => {
      connectionRef.current = handler;
    },
    emit: () => {},
    off: () => {
      connectionRef.current = null;
    },
  } as unknown as ServerProps["transport"];

  const labelControl: { current: ((label: string) => void) | null } = { current: null };

  function StatefulProducer(): React.ReactElement {
    const [label, setLabel] = React.useState("initial");
    labelControl.current = setLabel;
    return React.createElement(TestView, { label, onSelect: () => {} });
  }

  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch(req, srv) {
      const url = new URL(req.url);
      if (url.pathname === "/ws") {
        const token = url.searchParams.get("token");
        if (token !== TEST_TOKEN) return new Response("Unauthorized", { status: 401 });
        const data: SocketData = { id: globalThis.crypto.randomUUID() };
        const upgraded = srv.upgrade(req, { data });
        if (upgraded) return undefined;
        return new Response("Upgrade failed", { status: 500 });
      }
      return new Response("Not found", { status: 404 });
    },
    websocket: {
      open(ws: ServerWebSocket<SocketData>) {
        const { transport: clientTransport, dispatch, disconnect } = createWebSocketTransport(ws);
        clients.set(ws.data.id, { dispatch, disconnect });
        connectionRef.current?.({ ...clientTransport, id: ws.data.id });
      },
      message(ws: ServerWebSocket<SocketData>, message: string | Buffer) {
        clients.get(ws.data.id)?.dispatch(message as string | Uint8Array);
      },
      close(ws: ServerWebSocket<SocketData>) {
        const client = clients.get(ws.data.id);
        if (client) {
          client.disconnect();
          clients.delete(ws.data.id);
        }
      },
    },
  });

  Render(React.createElement(Server, { transport: serverTransport, singleInstance: true }, () => React.createElement(StatefulProducer)));

  return {
    port: server.port,
    setLabel: (label: string) => {
      if (!labelControl.current) throw new Error("Server component not mounted yet — cannot set label");
      labelControl.current(label);
    },
    stop: () => {
      server.stop();
      clients.clear();
    },
  };
}

interface TestClient {
  readonly updateViews: ReadonlyArray<UpdateViewPayload>;
  readonly trees: ReadonlyArray<TreePayload>;
  readonly requestTree: () => void;
  readonly close: () => void;
}

function connectClient(port: number): Promise<TestClient> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${TEST_TOKEN}`);
    ws.binaryType = "arraybuffer";

    const updateViews: Array<UpdateViewPayload> = [];
    const trees: Array<TreePayload> = [];

    ws.addEventListener("message", (event: MessageEvent) => {
      const bytes = new Uint8Array(event.data as ArrayBuffer);
      const { event: eventName, data } = decodeMessage(bytes);
      if (eventName === "update_view") updateViews.push(data as UpdateViewPayload);
      if (eventName === "update_views_tree") trees.push(data as TreePayload);
    });

    ws.addEventListener("open", () => {
      resolve({
        updateViews,
        trees,
        requestTree: () => ws.send(encodeMessage("request_views_tree", undefined)),
        close: () => ws.close(),
      });
    });

    ws.addEventListener("error", reject);
  });
}

function findTestView(tree: TreePayload) {
  return tree.views.find((candidate) => candidate.name === "HandshakeTestView");
}

function hasLabelDiff(client: TestClient, label: string): boolean {
  return client.updateViews.some((update) =>
    update.view.props.create.some((prop) => prop.type === "data" && prop.name === "label" && prop.data === label),
  );
}

async function connectAndSync(port: number): Promise<TestClient> {
  const client = await connectClient(port);
  await waitFor(() => {
    if (client.trees.some((tree) => findTestView(tree))) return true;
    client.requestTree();
    return false;
  }, "client to receive a snapshot containing the test view");
  return client;
}

describe("View Sync Handshake", () => {
  const servers: Array<ServerHandle> = [];

  afterAll(() => {
    for (const server of servers) server.stop();
  });

  test("view diffs reach synced clients but never clients that have not requested the tree", async () => {
    const server = createTestServer();
    servers.push(server);

    const syncedClient = await connectAndSync(server.port);

    // Unsynced client: connected, but never requests the view tree.
    const unsyncedClient = await connectClient(server.port);

    server.setLabel("updated-1");

    // Positive control: the synced client receives the prop diff, proving the
    // broadcast fired — so the unsynced client's silence is the gate, not timing.
    await waitFor(() => hasLabelDiff(syncedClient, "updated-1"), "synced client to receive the label diff");
    expect(unsyncedClient.updateViews).toEqual([]);

    // After the handshake, the same client receives subsequent diffs.
    unsyncedClient.requestTree();
    await waitFor(() => unsyncedClient.trees.length > 0, "late client to receive the snapshot");

    server.setLabel("updated-2");
    await waitFor(() => hasLabelDiff(unsyncedClient, "updated-2"), "late client to receive diffs after handshake");

    syncedClient.close();
    unsyncedClient.close();
  });

  test("snapshot delivers full props, including callback event props", async () => {
    const server = createTestServer();
    servers.push(server);

    const client = await connectAndSync(server.port);

    const snapshotTree = client.trees.find((tree) => findTestView(tree));
    if (!snapshotTree) throw new Error("No snapshot containing the test view was received");
    const snapshotView = findTestView(snapshotTree);
    if (!snapshotView) throw new Error("Test view missing from the snapshot");

    const propTypesByName = new Map(snapshotView.props.map((prop) => [prop.name, prop.type]));

    // The crash mode this guards against: a view reaching the client without its
    // callback props, so `props.onSelect.mutate` dereferences undefined.
    expect(propTypesByName.get("onSelect")).toBe("event");
    expect(propTypesByName.get("label")).toBe("data");

    client.close();
  });
});
