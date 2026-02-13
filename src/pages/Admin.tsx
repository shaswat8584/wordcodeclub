import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Lock,
  Users,
  BookOpen,
  CalendarPlus,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalWords: number;
    wordsToday: number;
    avgPerUser: number;
  };
  wordsByDate: { date: string; count: number }[];
  difficultyBreakdown: { difficulty: string; count: number }[];
  recentWords: {
    word: string;
    difficulty: string;
    displayName: string;
    createdAt: string;
  }[];
  topUsers: {
    displayName: string;
    wordCount: number;
    latestActivity: string;
  }[];
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
];

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card className="bg-card border border-border">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="rounded-md bg-muted p-2.5">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "admin-dashboard",
        { body: { password: storedPassword } }
      );
      if (error) throw error;
      return data as DashboardData;
    },
    enabled: authenticated,
    refetchInterval: 60_000,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.functions.invoke("admin-auth", {
        body: { password },
      });
      if (error || !data?.success) {
        toast({ title: "Wrong password", variant: "destructive" });
      } else {
        setStoredPassword(password);
        setAuthenticated(true);
      }
    } catch {
      toast({ title: "Error verifying password", variant: "destructive" });
    }
  };

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-sm">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-card border border-border">
            <CardHeader className="text-center">
              <Lock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <CardTitle className="text-xl font-normal">
                Admin Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-sm"
                />
                <Button type="submit" className="w-full">
                  Unlock
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-normal mb-6 tracking-tight">
        Admin — Dashboard
      </h1>

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-lg bg-muted animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers ?? 0}
              icon={Users}
            />
            <StatCard
              title="Total Words"
              value={stats?.totalWords ?? 0}
              icon={BookOpen}
            />
            <StatCard
              title="Words Today"
              value={stats?.wordsToday ?? 0}
              icon={CalendarPlus}
            />
            <StatCard
              title="Avg / User"
              value={stats?.avgPerUser ?? 0}
              icon={TrendingUp}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Area Chart */}
            <Card className="md:col-span-2 bg-card border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Words Added (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.wordsByDate}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.15)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="bg-card border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Difficulty Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.difficultyBreakdown}
                      dataKey="count"
                      nameKey="difficulty"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      label={({ difficulty, count }) =>
                        `${difficulty} (${count})`
                      }
                    >
                      {data.difficultyBreakdown.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tables Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Words */}
            <Card className="bg-card border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Word</TableHead>
                      <TableHead className="text-xs">Difficulty</TableHead>
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentWords.map((w, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium capitalize">
                          {w.word}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-wider"
                          >
                            {w.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {w.displayName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card className="bg-card border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Words</TableHead>
                      <TableHead className="text-xs">Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topUsers.map((u, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">
                          {u.displayName}
                        </TableCell>
                        <TableCell className="text-xs">
                          {u.wordCount}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(u.latestActivity).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
