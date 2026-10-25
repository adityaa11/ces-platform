import { runAtlasAdminCommand } from "./admin-bootstrap-cli.js";

const exitCode = await runAtlasAdminCommand(process.argv.slice(2));
process.exitCode = exitCode;
