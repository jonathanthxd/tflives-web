// Next resolves this marker itself. Plain Node tests use its empty server entry.
// Unit tests exercise PGlite fixtures, never a configured deployment database.
// Service imports still instantiate Prisma and need a valid, unreachable URL.
process.env.DATABASE_URL = "postgresql://unit:unit@127.0.0.1:1/unit_unused";
import { registerHooks } from "node:module";
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier, context);
  },
});
