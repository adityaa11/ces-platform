// The SQL fixture lives beside the database migrations it qualifies.  Keep the
// executable ticket harness at the Bridge package boundary because Bridge owns
// the existing reservation/window lifecycle that the projection reads.
import "../../../packages/atlas-db/tests/process-capacity-window-usage.integration.test.ts";
