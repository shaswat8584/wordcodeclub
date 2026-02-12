import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

interface WordCardProps {
  word: Tables<"words">;
}

const difficultyStyles: Record<string, string> = {
  easy: "difficulty-easy",
  medium: "difficulty-medium",
  hard: "difficulty-hard",
};

const difficultyEmoji: Record<string, string> = {
  easy: "🟢",
  medium: "🟡",
  hard: "🔴",
};

export default function WordCard({ word }: WordCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/word/${word.id}`}>
        <Card className="glass-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors capitalize">
                {word.word}
              </CardTitle>
              <Badge className={`${difficultyStyles[word.difficulty]} text-xs border-0`}>
                {difficultyEmoji[word.difficulty]} {word.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{word.definition}</p>
            {word.example_sentence && (
              <p className="text-xs text-muted-foreground/70 mt-2 italic line-clamp-1">
                "{word.example_sentence}"
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
