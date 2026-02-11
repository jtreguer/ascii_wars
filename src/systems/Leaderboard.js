const STORAGE_KEY = 'ascii-wars-leaderboard';
const MAX_ENTRIES = 20;

export function saveScore(score, level, won) {
  const entries = getScores();
  entries.push({ score, level, won, date: Date.now() });
  entries.sort((a, b) => b.score - a.score);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (_) { /* storage full or unavailable */ }
  return entries;
}

export function getScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function getRank(scores, targetScore) {
  for (let i = 0; i < scores.length; i++) {
    if (scores[i].score === targetScore) return i;
  }
  return -1;
}
