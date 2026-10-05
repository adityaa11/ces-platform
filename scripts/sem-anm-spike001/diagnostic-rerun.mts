import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { invokeTransportDiagnostic } from "./anoman-client.mts";

const out = resolve(fileURLToPath(new URL("../../.atlas-data/sem-anm-spike001/", import.meta.url)));
await mkdir(out, { recursive: true });
try {
  const evidence = { authorization_id: "HMN-SEM-ANM-SPIKE001-001", call_type: "one diagnostic Gate A rerun", ...(await invokeTransportDiagnostic()) };
  await writeFile(resolve(out, "gate-a-diagnostic-rerun.json"), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ http_status: evidence.http_status, model: evidence.model, finish_reason: evidence.finish_reason, raw_content_type: typeof evidence.raw_message_content }));
} catch (error) {
  const evidence = { authorization_id: "HMN-SEM-ANM-SPIKE001-001", call_type: "one diagnostic Gate A rerun", error: error instanceof Error ? error.message : "Unknown diagnostic failure" };
  await writeFile(resolve(out, "gate-a-diagnostic-rerun.json"), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ diagnostic: "failed" })); process.exitCode = 2;
}
