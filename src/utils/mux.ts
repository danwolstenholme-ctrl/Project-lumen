import Mux from "@mux/mux-node";

// Reads MUX_TOKEN_ID, MUX_TOKEN_SECRET, MUX_WEBHOOK_SECRET from env at first call.
// Lazy-init because module-level instantiation crashes the build when env vars
// aren't present at compile time.

let _mux: Mux | null = null;

export function getMux(): Mux {
  if (!_mux) {
    _mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
      webhookSecret: process.env.MUX_WEBHOOK_SECRET,
    });
  }
  return _mux;
}
