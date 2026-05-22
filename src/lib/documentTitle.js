export const APP_NAME = "QuizForm";

export function formatDocumentTitle(pageTitle) {
  if (!pageTitle || pageTitle === APP_NAME) return APP_NAME;
  return `${APP_NAME} | ${pageTitle}`;
}

export function setDocumentTitle(pageTitle) {
  document.title = formatDocumentTitle(pageTitle);
}
