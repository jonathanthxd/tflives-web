import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

const env = {
  ...process.env,
  TFL_TEAM_FIXTURE: "1",
  TFL_TEAM_ONLY: "1",
  TFL_TEAM_CHECKS: "1",
  TFL_PERF_OUTPUT: process.env.TFL_TEAM_OUTPUT || "performance-artifacts/team",
};
for (const script of [process.env.TFL_TEAM_CACHED === "1" ? "build-cached.mjs" : "build-isolated.mjs", "measure.mjs"]) {
  const child = spawn(process.execPath, [`scripts/performance/${script}`], { env, stdio: "inherit", windowsHide: true });
  const [code] = await once(child, "exit");
  assert.equal(code, 0, `Dedicated team fixture failed: ${script}`);
}
