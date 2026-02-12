import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const difficultyStyles: Record<string, string> = {
  easy: "difficulty-easy",
  medium: "difficulty-medium",
  hard: "difficulty-hard",
};

export default function WordDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: word, isLoading } = useQuery({
    queryKey: ["word", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("words").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="container mx-auto px-4 py-12"><div className="h-48 bg-muted animate-pulse rounded-xl" /></div>;
  if (!word) return (
    <div className="container mx-auto px-4 py-12 text-center">
      <p className="text-muted-foreground mb-4">Word not found.</p>
      <Button asChild><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Link></Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
      </Button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-4xl font-bold capitalize">{word.word}</h1>
              <Badge className={`${difficultyStyles[word.difficulty]} border-0`}>
                {word.difficulty}
              </Badge>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Definition</h3>
                <p className="text-lg">{word.definition}</p>
              </div>
              {word.example_sentence && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Example</h3>
                  <p className="text-lg italic text-muted-foreground">"{word.example_sentence}"</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Added on {new Date(word.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
