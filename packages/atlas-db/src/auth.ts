/**
 * Authentication-only database boundary.
 *
 * Keep this entry point free of the broader database barrel so worker-loaded
 * authentication code does not initialize unrelated application subsystems.
 */
export { createDatabase } from "./client.js";
export { atlasAdminBootstrapState, authAccount, authSession, authUser, authVerification } from "./schema.js";
