/**
 * TikTok follower gate adapter for PLAYFINITY / word-guessing game.
 *
 * IMPORTANT:
 * - Run this check in the trusted Node.js server, not in browser code.
 * - The TikTok-Live-Connector is an unofficial, reverse-engineered interface.
 * - Missing/unknown follow status is treated as NOT VERIFIED (fail closed)
 *   whenever followersOnly is enabled.
 */

/**
 * Extracts the documented TikTok follow status from common connector payloads.
 * 0 = not following, 1 = following, 2 = mutual follow.
 * Returns 0 | 1 | 2 | null.
 */
function getTikTokFollowStatus(event) {
  const candidates = [
    event && event.user && event.user.followStatus,
    event && event.followInfo && event.followInfo.followStatus,
    event && event.user && event.user.followInfo && event.user.followInfo.followStatus,
  ];

  for (const value of candidates) {
    if (value === 0 || value === 1 || value === 2) return value;
    if (value === "0" || value === "1" || value === "2") return Number(value);
  }

  return null;
}

/**
 * Decides whether a viewer may participate.
 * If followersOnly is off, everyone may participate.
 * If it is on, only an explicitly verified follower status (1 or 2) passes.
 */
function canViewerParticipate({ followersOnly, tiktokEvent }) {
  if (!followersOnly) return true;
  const status = getTikTokFollowStatus(tiktokEvent);
  return status === 1 || status === 2;
}

module.exports = {
  getTikTokFollowStatus,
  canViewerParticipate,
};
