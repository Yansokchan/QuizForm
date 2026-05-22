import { useEffect } from "react";
import { setDocumentTitle } from "../lib/documentTitle";

export function useDocumentTitle(pageTitle) {
  useEffect(() => {
    setDocumentTitle(pageTitle);
  }, [pageTitle]);
}
