// Next resolves this marker itself. Plain Node tests use its empty server entry.
import { registerHooks } from "node:module";
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier, context);
  },
});
