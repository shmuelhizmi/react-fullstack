import { describe, expect, mock, test } from "bun:test";
import { encodeMessage } from "../src/shared/binary-protocol";
import { decompileTransport } from "../src/shared/decompiled-transport";
import type { Transport } from "../src/shared/types";

interface BinaryEvents {
  readonly __bin__: Uint8Array;
}

const VIEW_TREE_FRAME = encodeMessage("update_views_tree", {
  views: [
    {
      uid: "replayed-status",
      name: "Status",
      parentUid: "",
      childIndex: 0,
      isRoot: true,
      props: [{ name: "label", type: "data", data: "ready" }],
    },
  ],
});

function createSynchronouslyReplayingTransport(): Transport<BinaryEvents> {
  return {
    emit: () => undefined,
    on: (_event, handler) => handler(VIEW_TREE_FRAME),
    off: () => undefined,
  };
}

describe("decompileTransport", () => {
  test("delivers a frame replayed while the raw listener attaches", () => {
    const handler = mock(() => undefined);
    const transport = decompileTransport(createSynchronouslyReplayingTransport());

    transport.on("update_views_tree", handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0].views[0]?.name).toBe("Status");
  });
});
