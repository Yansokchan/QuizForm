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

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, end: true },
  { name: "Quizzes", path: "/dashboard/quizzes", icon: BookOpen },
  { name: "Submissions", path: "/dashboard/submissions", icon: Activity },
  { name: "Classes & Students", path: "/dashboard/classes", icon: Users },
];

const bottomItems = [
  { name: "Settings", path: "#", icon: Settings },
  { name: "Search", path: "#", icon: Search },
];

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-[#FDFCFD] text-slate-900" style={{ colorScheme: "light" }}>
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-[#E9D5FF]/40 border-r border-purple-200/50">
        <div className="p-4 pb-4">
          <div className="flex items-center mb-4 px-2 group">
            <img
              src="/logo.avif"
              alt=""
              className="size-8 -ml-3 group-hover:rotate-10 group-hover:scale-120 transition-all duration-200"
            />
            <span className="font-semibold text-slate-700">QuizForm</span>
          </div>

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
          {bottomItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-slate-500 hover:text-purple-600 hover:bg-purple-100/50 transition-all"
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.name}
            </Link>
          ))}

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
              onClick={logout}
            >
              <LogOut className="h-4 w-4 group-hover:-rotate-20 group-hover:scale-110 transition-all duration-200" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-white fixed top-0 w-full z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            Q
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-700">
            QuizForm
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-white pt-16">
          <nav className="p-4 space-y-6">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    end={item.end}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all
                        ${
                          isActive
                            ? "bg-purple-50 text-purple-600"
                            : "text-slate-500 hover:bg-purple-50 hover:text-purple-600"
                        }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="pt-4 mt-4 border-t border-purple-100/50">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-500 hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 rounded-xl my-2 md:ml-64 min-h-screen pt-16 md:pt-0">
        <div className="p-6 max-w-[1400px] mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
