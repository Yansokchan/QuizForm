import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { setDocumentTitle } from "../lib/documentTitle";

const ROUTE_TITLES = [
  { path: "/dashboard/quiz/create", title: "Create" },
  { path: "/dashboard/quiz/:id/results", title: "Results" },
  { path: "/dashboard/quiz/:id", title: "Edit" },
  { path: "/dashboard/submissions", title: "Submissions" },
  { path: "/dashboard/classes", title: "Classes" },
  { path: "/dashboard/quizzes", title: "Quizzes" },
  { path: "/dashboard", title: "Dashboard", end: true },
  { path: "/demo", title: "Demo" },
  { path: "/login", title: "Sign In" },
  { path: "/q/:token", title: "Quiz" },
  { path: "/", title: "", end: true },
];

function titleForPath(pathname) {
  for (const route of ROUTE_TITLES) {
    if (matchPath({ path: route.path, end: route.end ?? false }, pathname)) {
      return route.title;
    }
  }
  return null;
}

export default function RouteTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = titleForPath(pathname);
    if (title) setDocumentTitle(title);
  }, [pathname]);

  return null;
}
