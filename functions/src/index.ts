/**
 * Firebase Cloud Functions — Alvey Website
 *
 * All functions are exported from this file.
 */

import { setGlobalOptions } from "firebase-functions";
import { createClassSession } from "./classroom/createClassSession";
import { ingestSessionEnd } from "./classroom/ingestSessionEnd";
import { maskChatMessage } from "./safety/maskMessage";
import { analyzeReceipt } from "./payment/analyzeReceipt.js";
import { approvePayment } from "./payment/approvePayment.js";

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

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export { analyzeReceipt, approvePayment };
