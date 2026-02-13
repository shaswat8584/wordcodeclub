import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";
import { ArrowUpRight } from "lucide-react";

interface WordCardProps {
  word: Tables<"words">;
}

export default function WordCard({ word }: WordCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <Link to={`/word/${word.id}`}>
        <Card className="bg-card border border-border hover:border-foreground/30 transition-all duration-200 cursor-pointer group relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-normal capitalize font-['Instrument_Serif'] group-hover:text-foreground/80 transition-colors">
                  {word.word}
                </h3>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-sans font-medium">
                  {word.difficulty}
                </Badge>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2 font-sans">Definition</h4>
                <div className="space-y-2">
                  {word.definition.includes(" | ") || word.definition.includes("(") ? (
                    word.definition.split(" | ").slice(0, 1).map((section, i) => {
                      const posMatch = section.match(/^\(([^)]+)\)\s*/);
                      const partOfSpeech = posMatch ? posMatch[1] : null;
                      const defs = section.split("; ").map(d => d.replace(/^\([^)]+\)\s*/, ""));
                      return (
                        <div key={i}>
                          {partOfSpeech && (
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5 font-sans">{partOfSpeech}</p>
                          )}
                          <ul className="space-y-0.5">
                            {defs.slice(0, 2).map((d, j) => (
                              <li key={j} className="text-sm leading-relaxed line-clamp-1">{d}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm leading-relaxed line-clamp-2">{word.definition}</p>
                  )}
                </div>
              </div>
              {word.example_sentence && (
                <div>
                  <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 font-sans">Example</h4>
                  <p className="text-xs italic text-muted-foreground line-clamp-1">"{word.example_sentence}"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
