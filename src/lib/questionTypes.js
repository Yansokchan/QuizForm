/** Treat common DB/JSON shapes as "marked correct" (strict true missed some rows). */
export function optionIsMarkedCorrect(o) {
  if (!o || typeof o !== 'object') return false
  const v = o.is_correct
  return v === true || v === 1 || v === 'true' || v === '1'
}

/**
 * @param {{ options?: { is_correct?: unknown }[] } | null | undefined} question
 * @returns {boolean}
 */
export function isMultiSelectQuestion(question) {
  const opts = question?.options ?? []
  let correct = 0
  for (const o of opts) {
    if (optionIsMarkedCorrect(o)) correct += 1
  }
  return correct > 1
}
