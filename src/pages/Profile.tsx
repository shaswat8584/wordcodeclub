import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, BookOpen, User } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: words = [] } = useQuery({
    queryKey: ["my-words", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("words").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: scores = [] } = useQuery({
    queryKey: ["my-scores", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("quiz_scores").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Sign in to view your profile.</p>
        <Button className="gradient-btn rounded-full" asChild><Link to="/auth">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Profile header */}
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile?.display_name ?? "User"}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold">{words.length}</div>
              <p className="text-sm text-muted-foreground">Words Added</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto text-accent mb-2" />
              <div className="text-3xl font-bold">{scores.length}</div>
              <p className="text-sm text-muted-foreground">Quizzes Taken</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent scores */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-lg">Recent Quiz Scores</CardTitle></CardHeader>
          <CardContent>
            {scores.length === 0 ? (
              <p className="text-muted-foreground text-sm">No quizzes taken yet.</p>
            ) : (
              <div className="space-y-2">
                {scores.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <span className="font-medium">{s.score}/{s.total}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">{s.difficulty}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contributed words */}
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-lg">My Words</CardTitle></CardHeader>
          <CardContent>
            {words.length === 0 ? (
              <p className="text-muted-foreground text-sm">No words contributed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {words.map(w => (
                  <Link key={w.id} to={`/word/${w.id}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 capitalize">{w.word}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
