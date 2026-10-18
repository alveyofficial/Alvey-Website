/**
 * Firebase Cloud Functions — Alvey Website
 *
 * All functions are exported from this file.
 */

import { setGlobalOptions } from "firebase-functions";
import { createClassSession } from "./classroom/createClassSession";
import { ingestSessionEnd } from "./classroom/ingestSessionEnd";
import { maskChatMessage } from "./safety/maskMessage";

// ---------------------------------------------------------------------------
// Global defaults
// ---------------------------------------------------------------------------

setGlobalOptions({ maxInstances: 10 });

// ---------------------------------------------------------------------------
// Classroom feature
// ---------------------------------------------------------------------------

export { createClassSession, ingestSessionEnd };

// ---------------------------------------------------------------------------
// Trust & Safety
// ---------------------------------------------------------------------------

export { maskChatMessage };
