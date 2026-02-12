import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

export default function WordCard({ word }: WordCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Link to={`/word/${word.id}`}>
        <Card className="bg-card border border-border hover:border-foreground/20 transition-colors cursor-pointer group">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-normal capitalize font-['Instrument_Serif'] group-hover:text-foreground/80 transition-colors">
                {word.word}
              </h3>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-sans font-medium">
                {word.difficulty}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{word.definition}</p>
            {word.example_sentence && (
              <p className="text-xs text-muted-foreground/60 mt-3 italic line-clamp-1">
                "{word.example_sentence}"
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
