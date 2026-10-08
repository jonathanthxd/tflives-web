/**
 * Socket 0.2.11 does not await every protocol/rollback continuation on stop.
 * Drain the database mutex and socket-close callbacks before releasing WASM.
 * @param {import("@electric-sql/pglite-socket").PGLiteSocketServer} socket
 * @param {import("@electric-sql/pglite").PGlite} db
 */
export async function closeIsolatedDatabase(socket, db) {
  await socket.stop();
  await db.runExclusive(async () => {});
  await new Promise((resolve) => setImmediate(resolve));
  await db.runExclusive(async () => {});
  await db.close();
}
