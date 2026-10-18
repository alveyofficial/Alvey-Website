/**
 * src/features/classroom/index.ts
 *
 * Public API for the classroom feature module.
 *
 * Only export what external routes and shared components need.
 *
 * Intentionally NOT re-exported (internal implementation details):
 *   - useVideoRoom       → internal to the video adapter layer
 *   - DailyProvider      → never referenced outside providers/daily.ts
 *   - video/types.ts internals (Participant, VideoRoomState, etc.) are
 *     available via direct import for the handful of components that need them,
 *     but the module boundary keeps the public surface small.
 */

export { ClassroomLayout } from "./components/ClassroomLayout";
export { useClassSession } from "./hooks/useClassSession";
export { useAiChat } from "./hooks/useAiChat";

export type { AiMessage } from "./components/AiChatSidebar";
export type { UseClassSessionReturn, SessionStatus } from "./hooks/useClassSession";
