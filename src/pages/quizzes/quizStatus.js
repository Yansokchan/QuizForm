/** @param {{ is_paused?: boolean; start_at: string; end_at: string }} q */
export function getQuizStatus(q) {
  const now = new Date();
  if (q.is_paused) return "paused";
  if (now < new Date(q.start_at)) return "upcoming";
  if (now > new Date(q.end_at)) return "ended";
  return "active";
}
