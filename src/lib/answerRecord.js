/**
 * Whether a stored answer row reflects a student selection (vs skipped).
 * @param {{ selected_option_id?: string | null; selected_option_ids?: unknown }} a
 */
export function answerHasSelection(a) {
  if (a?.selected_option_id) return true
  const ids = a?.selected_option_ids
  if (Array.isArray(ids) && ids.length > 0) return true
  return false
}
