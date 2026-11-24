/**
 * PLAYFINITY Hangman scoring + TikTok follower gate.
 *
 * Run all authorization and scoring on a trusted Node.js server.
 * Do not accept follower status or score changes from the browser.
 */

const HANGMAN_RULES = Object.freeze({
  pointsPerCorrectLetter: 1,
  pointsForSolvingWord: 10,
  leaderboards: Object.freeze(["last24Hours", "weekly"]),
  dailyWindowHours: 24,
  weeklyStartsOn: "monday",
  weeklyTimezone: "UTC",
});

/**
 * Extracts TikTok follow status from common connector payloads.
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

/** Unknown status is rejected when follower-only mode is enabled. */
function canViewerParticipate({ followersOnly, tiktokEvent }) {
  if (!followersOnly) return true;
  const status = getTikTokFollowStatus(tiktokEvent);
  return status === 1 || status === 2;
}

/**
 * Awards one point for a correctly guessed letter, at most once per
 * player + letter + round. Repeated occurrences in the word still count once.
 * roundState must be kept server-side for the lifetime of the round.
 */
function awardCorrectLetter({ scores, roundState, userId, letter }) {
  if (!userId || !letter) return false;
  const normalizedLetter = String(letter).trim().toLocaleUpperCase();
  if (!normalizedLetter) return false;

  if (!roundState.letterAwards) roundState.letterAwards = {};
  if (!roundState.letterAwards[userId]) roundState.letterAwards[userId] = [];
  if (roundState.letterAwards[userId].includes(normalizedLetter)) return false;

  roundState.letterAwards[userId].push(normalizedLetter);
  scores[userId] = (scores[userId] || 0) + HANGMAN_RULES.pointsPerCorrectLetter;
  return true;
}

/** Awards the 10-point word bonus only once to the first correct solver. */
function awardSolvedWord({ scores, roundState, userId }) {
  if (!userId || roundState.wordSolvedBy) return false;
  roundState.wordSolvedBy = userId;
  scores[userId] = (scores[userId] || 0) + HANGMAN_RULES.pointsForSolvingWord;
  return true;
}

/**
 * Build two leaderboard views from timestamped score events.
 * Each event: { userId, points, timestamp } where timestamp is ms or ISO text.
 * The 24-hour board is rolling; the weekly board is the current UTC week
 * (Monday 00:00 UTC onward). Persist score events in the backend/database.
 */
function getLeaderboards(scoreEvents, now = Date.now()) {
  const current = new Date(now);
  const last24hStart = now - HANGMAN_RULES.dailyWindowHours * 60 * 60 * 1000;

  const monday = new Date(Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate()
  ));
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  const weeklyStart = monday.getTime();

  const totals = { last24Hours: {}, weekly: {} };
  for (const event of scoreEvents || []) {
    if (!event || !event.userId || !Number.isFinite(Number(event.points))) continue;
    const timestamp = typeof event.timestamp === "number"
      ? event.timestamp
      : Date.parse(event.timestamp);
    if (!Number.isFinite(timestamp) || timestamp > now) continue;

    if (timestamp >= last24hStart) {
      totals.last24Hours[event.userId] = (totals.last24Hours[event.userId] || 0) + Number(event.points);
    }
    if (timestamp >= weeklyStart) {
      totals.weekly[event.userId] = (totals.weekly[event.userId] || 0) + Number(event.points);
    }
  }

  const rank = (board) => Object.entries(board)
    .map(([userId, points]) => ({ userId, points }))
    .sort((a, b) => b.points - a.points || a.userId.localeCompare(b.userId));

  return {
    last24Hours: rank(totals.last24Hours),
    weekly: rank(totals.weekly),
  };
}

module.exports = {
  HANGMAN_RULES,
  getTikTokFollowStatus,
  canViewerParticipate,
  awardCorrectLetter,
  awardSolvedWord,
  getLeaderboards,
};
