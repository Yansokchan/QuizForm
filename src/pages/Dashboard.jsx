import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  PlusCircle,
  BookOpen,
  Users,
  Award,
  Activity,
  ChevronRight,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { notify } from "../lib/notify";

/* ─── Skeleton primitive ─────────────────────────────────────────── */
const Sk = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />
);

/* ─── Skeleton layouts ───────────────────────────────────────────── */
const QuickActionsSkeleton = () => (
  <div className="grid gap-4 lg:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="border-none bg-card/50">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-4">
            <Sk className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Sk className="h-4 w-28" />
              <Sk className="h-3 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const StatsSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="border-none bg-card/50">
        <CardContent className="px-5 py-5 space-y-3">
          <div className="flex justify-between items-start">
            <Sk className="h-4 w-24" />
            <Sk className="h-5 w-14 rounded-full" />
          </div>
          <Sk className="h-9 w-16" />
          <Sk className="h-3 w-28" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const ListSkeleton = ({ rows = 5 }) => (
  <div className="divide-y divide-slate-100/40">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5">
        <Sk className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Sk className="h-3.5 w-3/4" />
          <Sk className="h-2.5 w-1/2" />
        </div>
        <Sk className="h-5 w-14 rounded-full shrink-0" />
      </div>
    ))}
  </div>
);

/* ─── Wave chart (static decoration) ────────────────────────────── */
const WaveChart = ({ color = "#8b5cf6" }) => (
  <div className="h-64 w-full relative overflow-hidden mt-8">
    <svg viewBox="0 0 1000 200" className="w-full h-full">
      <defs>
        <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,150 C100,100 200,180 300,120 C400,60 500,140 600,100 C700,60 800,160 900,100 L1000,120 L1000,200 L0,200 Z"
        fill="url(#waveGradient)"
        initial={{ d: "M0,200 C100,200 200,200 300,200 C400,200 500,200 600,200 C700,200 800,200 900,200 L1000,200 L1000,200 L0,200 Z" }}
        animate={{ d: "M0,150 C100,100 200,180 300,120 C400,60 500,140 600,100 C700,60 800,160 900,100 L1000,120 L1000,200 L0,200 Z" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <motion.path
        d="M0,150 C100,100 200,180 300,120 C400,60 500,140 600,100 C700,60 800,160 900,100 L1000,120"
        fill="none"
        stroke={color}
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <motion.path
        d="M0,170 C150,140 250,190 350,150 C450,110 550,160 650,130 C750,100 850,180 1000,140 L1000,200 L0,200 Z"
        fill={color}
        fillOpacity="0.1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ delay: 0.5, duration: 1 }}
      />
    </svg>
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-full h-[1px] bg-slate-300" />
      ))}
    </div>
    <div className="flex justify-between mt-2 px-2 text-[10px] font-medium text-slate-400">
      {["Jun 1","Jun 5","Jun 9","Jun 13","Jun 17","Jun 21","Jun 25","Jun 29"].map((d) => (
        <span key={d}>{d}</span>
      ))}
    </div>
  </div>
);

/* ─── Main Dashboard ─────────────────────────────────────────────── */
export default function Dashboard() {
  const { session } = useAuth();
  const teacherId = session?.user?.id;
  const [stats, setStats] = useState({ totalQuizzes: 0, totalClasses: 0, totalSubmissions: 0, avgScore: 0 });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [topClasses, setTopClasses] = useState([]);
  const [activeRange, setActiveRange] = useState("Last 30 days");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!teacherId) {
        setStats({ totalQuizzes: 0, totalClasses: 0, totalSubmissions: 0, avgScore: 0 });
        setRecentQuizzes([]);
        setTopClasses([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: quizzesData, error } = await supabase
        .from("quizzes")
        .select("id, title, created_at, start_at, end_at, is_paused, quiz_classes(id, class_name), submissions(id, total_score, quiz_class_id)")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });

      if (error) {
        notify.error("Failed to load dashboard data.");
        setStats({ totalQuizzes: 0, totalClasses: 0, totalSubmissions: 0, avgScore: 0 });
        setRecentQuizzes([]);
        setTopClasses([]);
        setLoading(false);
        return;
      }

      if (quizzesData) {
        let totalClasses = 0, totalSubmissions = 0, totalScoreSum = 0;
        quizzesData.forEach((q) => {
          totalClasses += q.quiz_classes?.length ?? 0;
          totalSubmissions += q.submissions?.length ?? 0;
          q.submissions?.forEach((s) => { totalScoreSum += Number(s.total_score || 0); });
        });

        setStats({
          totalQuizzes: quizzesData.length,
          totalClasses,
          totalSubmissions,
          avgScore: totalSubmissions > 0 ? (totalScoreSum / totalSubmissions).toFixed(1) : 0,
        });

        setRecentQuizzes(quizzesData.slice(0, 5));

        const classStats = {};
        quizzesData.forEach((q) => {
          q.submissions?.forEach((s) => {
            const classObj = q.quiz_classes?.find((c) => c.id === s.quiz_class_id);
            const className = classObj?.class_name || "Unassigned";
            if (!classStats[className]) {
              classStats[className] = { totalScore: 0, count: 0, name: className };
            }
            classStats[className].totalScore += Number(s.total_score || 0);
            classStats[className].count += 1;
          });
        });

        setTopClasses(
          Object.values(classStats)
            .map((c) => ({ ...c, avgScore: c.count > 0 ? (c.totalScore / c.count).toFixed(1) : 0 }))
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 5)
        );
      }
      setLoading(false);
    };
    load();
  }, [teacherId]);

  const latestEligibleQuiz = useMemo(() => {
    const now = new Date();
    return recentQuizzes.find((q) => now >= new Date(q.start_at));
  }, [recentQuizzes]);

  const quickActions = [
    {
      title: latestEligibleQuiz ? "Latest Quiz Results" : "Create Quiz",
      description: latestEligibleQuiz ? `View results for "${latestEligibleQuiz.title}"` : "Build a new interactive assessment",
      icon: latestEligibleQuiz ? Award : PlusCircle,
      color: latestEligibleQuiz ? "bg-amber-500" : "bg-purple-500",
      action: () => latestEligibleQuiz ? navigate(`/dashboard/quiz/${latestEligibleQuiz.id}/results`) : navigate("/dashboard/quiz/create"),
    },
    { title: "View Classes", description: "Manage your students and groups", icon: Users, color: "bg-blue-500", action: () => navigate("/dashboard/classes") },
    { title: "All Quizzes", description: "Browse and edit your existing quizzes", icon: BookOpen, color: "bg-emerald-500", action: () => navigate("/dashboard/quizzes") },
  ];

  const statsItems = [
    { label: "Total Quizzes", value: stats.totalQuizzes, icon: BookOpen, trend: "+12.5%", trendUp: true },
    { label: "Total Classes", value: stats.totalClasses, icon: Users, trend: "-2%", trendUp: false },
    { label: "Avg. Score", value: `${stats.avgScore}%`, icon: Award, trend: "+8.4%", trendUp: true },
    { label: "Submissions", value: stats.totalSubmissions, icon: Activity, trend: "+14%", trendUp: true },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Welcome back!</h2>
        <p className="text-slate-500 mt-1">Here's what's happening with your quizzes and classes today.</p>
      </div>

      {/* Quick Actions */}
      {loading ? <QuickActionsSkeleton /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="group clay-element cursor-pointer border-none bg-card/50 backdrop-blur-md hover:bg-card transition-all duration-300"
              onClick={action.action}
            >
              <CardContent className="px-5">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${action.color} text-white shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-700 group-hover:text-purple-600 transition-colors">{action.title}</h3>
                    <p className="text-xs text-slate-400">{action.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {loading ? <StatsSkeleton /> : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsItems.map((item) => (
            <Card key={item.label} className="border-none clay-element bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="px-5 relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-slate-500">{item.label}</span>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${item.trendUp ? "trend-up" : "trend-down"}`}>
                    {item.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {item.trend}
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-700 mb-1">{item.value}</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <item.icon className="h-3 w-3" />
                  Updated just now
                </div>
                <item.icon className="absolute -bottom-2 -right-2 h-16 w-16 text-slate-500/5 rotate-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom two-column section */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Quizzes */}
        <Card className="border-none clay-element bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100/50">
            <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              Recent Quizzes
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">Your 5 latest quiz creations</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {loading ? <ListSkeleton rows={5} /> : recentQuizzes.length > 0 ? (
              <div className="divide-y divide-slate-100/40">
                {recentQuizzes.map((quiz) => {
                  const now = new Date();
                  const start = new Date(quiz.start_at);
                  const end = new Date(quiz.end_at);
                  let statusLabel = "Active";
                  let statusCls = "bg-emerald-100 text-emerald-700";
                  if (quiz.is_paused) { statusLabel = "Paused"; statusCls = "bg-amber-100 text-amber-700"; }
                  else if (now < start) { statusLabel = "Upcoming"; statusCls = "bg-blue-100 text-blue-700"; }
                  else if (now > end) { statusLabel = "Ended"; statusCls = "bg-slate-100 text-slate-500"; }
                  return (
                    <div
                      key={quiz.id}
                      className="flex items-center gap-4 px-4 py-3.5 hover:bg-purple-50/30 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/dashboard/quiz/${quiz.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-700 truncate group-hover:text-purple-600 transition-colors">
                          {quiz.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />{new Date(quiz.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Users className="h-3 w-3" />{quiz.quiz_classes?.length || 0} Classes
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Activity className="h-3 w-3" />{quiz.submissions?.length || 0} Submissions
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-sm">No quizzes yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Top Classes */}
        <Card className="border-none clay-element bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100/50">
            <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Top Classes
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">Ranked by total score across all quizzes</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {loading ? <ListSkeleton rows={5} /> : topClasses.length > 0 ? (() => {
              const maxScore = topClasses[0]?.totalScore || 1;
              return (
                <div className="divide-y divide-slate-100/40">
                  {topClasses.map((item, i) => {
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                    const rankCls =
                      i === 0 ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : i === 1 ? "bg-slate-100 text-slate-500 border border-slate-200"
                      : i === 2 ? "bg-orange-50 text-orange-500 border border-orange-200"
                      : "bg-purple-50 text-purple-400 border border-purple-100";
                    const barPct = Math.round((item.totalScore / maxScore) * 100);
                    return (
                      <div key={item.name} className="px-4 py-3.5 hover:bg-purple-50/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankCls}`}>
                            {medal || i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <h4 className="text-sm font-semibold text-slate-700 truncate">{item.name}</h4>
                              <div className="flex items-center gap-4 shrink-0 text-right">
                                <div>
                                  <div className="text-[10px] text-slate-400">Submissions</div>
                                  <div className="text-sm font-bold text-slate-600">{item.count}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-400">Total Score</div>
                                  <div className="text-sm font-bold text-purple-600">{item.totalScore.toFixed(1)}</div>
                                </div>
                              </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-700"
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })() : (
              <div className="p-12 text-center text-slate-400 text-sm">No class data yet.</div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
