import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Search,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Toaster } from "./ui/sonner";
import {
  ConfirmDialogProvider,
  useConfirm,
} from "../contexts/ConfirmDialogContext";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, end: true },
  { name: "Quizzes", path: "/dashboard/quizzes", icon: BookOpen },
  { name: "Submissions", path: "/dashboard/submissions", icon: Activity },
  { name: "Classes & Students", path: "/dashboard/classes", icon: Users },
];


function BrandLogo({ className = "" }) {
  return (
    <div className={`flex items-center group ${className}`}>
      <img
        src="/logo.avif"
        alt=""
        className="size-8 -ml-3 group-hover:rotate-10 group-hover:scale-120 transition-all duration-200"
      />
      <span className="font-semibold text-slate-700">QuizForm</span>
    </div>
  );
}

function DashboardLayoutInner() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const confirm = useConfirm();

  /* Dashboard is light-only: shadcn tokens (e.g. bg-card) follow html.dark — strip it here and restore on leave. */
  useEffect(() => {
    document.documentElement.classList.remove("dark");

    return () => {
      const stored = localStorage.getItem("quizform-theme");
      if (stored === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
  }, []);

  useEffect(() => {
    const applyUser = (authUser) => {
      setUser(authUser?.user_metadata ?? null);
    };
    supabase.auth.getUser().then(({ data }) => {
      applyUser(data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  const logout = async () => {
    const confirmed = await confirm({
      title: "Log out?",
      description: "You will be signed out of QuizForm and returned to the home page.",
      confirmLabel: "Log out",
      cancelLabel: "Stay signed in",
      variant: "destructive",
    });
    if (!confirmed) return;
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#FDFCFD] text-slate-900" style={{ colorScheme: "light" }}>
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-[#E9D5FF]/40 border-r border-purple-200/50">
        <div className="p-4 pb-4">
          <BrandLogo className="mb-4 px-2" />

          <Button
            className="w-full bg-[#6d28d9] hover:bg-[#6d28d9]/80"
            onClick={() => navigate("/dashboard/quiz/create")}
          >
            <PlusCircle className="h-5 w-5" />
            Quick Create
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
          <div className="border-t border-purple-200/50 pt-5">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-sm text-[14px] font-medium transition-all
                      ${
                        isActive
                          ? "text-white bg-[#8b5cf6]"
                          : "text-slate-500 hover:text-purple-600 hover:bg-purple-200/50"
                      }
                    `}
                  >
                    <item.icon className={`h-4.5 w-4.5`} />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-4 mt-auto space-y-1">
          <div className="mt-4 pt-4 border-t border-purple-200/50 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold flex-shrink-0">
                {user?.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-700 truncate">
                  {user?.full_name || "User"}
                </span>
                <span className="text-xs text-slate-400 truncate">
                  {user?.email}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-red-600 group"
              aria-label="Log out"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 group-hover:-rotate-20 group-hover:scale-110 transition-all duration-200" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between border-b border-purple-200/50 bg-[#E9D5FF]/40 px-4 py-3 backdrop-blur-sm">
        <BrandLogo />
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-600 hover:bg-purple-200/50"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 flex flex-col bg-[#E9D5FF] pt-[60px]">
          <nav className="flex flex-1 flex-col overflow-y-auto p-4">
            <Button
              className="mb-4 w-full bg-[#6d28d9] hover:bg-[#6d28d9]/80"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate("/dashboard/quiz/create");
              }}
            >
              <PlusCircle className="h-5 w-5" />
              Quick Create
            </Button>

            <ul className="space-y-1 border-t border-purple-200/50 pt-4">
              {navItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    end={item.end}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-sm px-3 py-2.5 text-[15px] font-medium transition-all ${
                        isActive
                          ? "bg-[#8b5cf6] text-white"
                          : "text-slate-500 hover:bg-purple-200/50 hover:text-purple-600"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-auto space-y-1 border-t border-purple-200/50 pt-4">
              
              <div className="mt-4 flex items-center justify-between border-t border-purple-200/50 pt-4">
                <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                    {user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-slate-700">
                      {user?.full_name || "User"}
                    </span>
                    <span className="truncate text-xs text-slate-400">
                      {user?.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-slate-400 hover:text-red-600"
                  aria-label="Log out"
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    await logout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="min-w-0 flex-1 overflow-x-hidden rounded-xl pt-[60px] md:ml-64 md:pt-0 md:my-2 min-h-screen">
        <div className="mx-auto h-full max-w-[1400px] min-w-0 p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
      <Toaster richColors closeButton position="top-right" />
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <ConfirmDialogProvider>
      <DashboardLayoutInner />
    </ConfirmDialogProvider>
  );
}
