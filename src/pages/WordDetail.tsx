import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function WordDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: word, isLoading } = useQuery({
    queryKey: ["word", id, user?.id],
    queryFn: async () => {
      let q = supabase.from("words").select("*").eq("id", id!);
      if (user) q = q.eq("user_id", user.id);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="container mx-auto px-4 py-12 max-w-2xl"><div className="h-48 bg-muted animate-pulse rounded-lg" /></div>;
  if (!word) return (
    <div className="container mx-auto px-4 py-12 text-center">
      <p className="text-muted-foreground mb-4 text-sm">Word not found.</p>
      <Button variant="outline" size="sm" asChild><Link to="/"><ArrowLeft className="mr-2 h-3 w-3" />Back</Link></Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-6 text-muted-foreground">
        <Link to="/"><ArrowLeft className="mr-1.5 h-3 w-3" />Back</Link>
      </Button>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="bg-card/80 backdrop-blur-xl border border-border relative z-10">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-4xl font-normal capitalize tracking-tight">{word.word}</h1>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-sans font-medium">
                {word.difficulty}
              </Badge>
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3 font-sans">Definition</h3>
                <div className="space-y-3">
                  {word.definition.includes(" | ") || word.definition.includes("(") ? (
                    word.definition.split(" | ").map((section, i) => {
                      const posMatch = section.match(/^\(([^)]+)\)\s*/);
                      const partOfSpeech = posMatch ? posMatch[1] : null;
                      const defs = section.split("; ").map(d => d.replace(/^\([^)]+\)\s*/, ""));
                      return (
                        <div key={i}>
                          {partOfSpeech && (
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 font-sans">{partOfSpeech}</p>
                          )}
                          <ul className="space-y-1">
                            {defs.map((d, j) => (
                              <li key={j} className="text-sm leading-relaxed">{d}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-base leading-relaxed">{word.definition}</p>
                  )}
                </div>
              </div>
              {word.example_sentence && (
                <div>
                  <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2 font-sans">Example</h3>
                  <p className="text-base italic text-muted-foreground">"{word.example_sentence}"</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground/60 pt-2">
                Added {new Date(word.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
