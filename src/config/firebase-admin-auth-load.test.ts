import { spawnSync } from "node:child_process";

describe("firebase-admin/auth", () => {
  it("loads under CommonJS require when ESM require() is disabled", () => {
    const result = spawnSync(
      process.execPath,
      ["--no-require-module", "-e", "require('firebase-admin/auth')"],
      { encoding: "utf8" }
    );

    expect({
      status: result.status,
      stderr: result.stderr,
    }).toEqual({ status: 0, stderr: "" });
  });
});
