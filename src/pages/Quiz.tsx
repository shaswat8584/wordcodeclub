import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, Play } from "lucide-react";

type QuizState = "setup" | "playing" | "results";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz() {
  const [difficulty, setDifficulty] = useState<string>("all");
  const [state, setState] = useState<QuizState>("setup");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{ correct: number; total: number } | null>(null);

  const { data: allWords = [] } = useQuery({
    queryKey: ["quiz-words", difficulty],
    queryFn: async () => {
      let q = supabase.from("words").select("*");
      if (difficulty !== "all") q = q.eq("difficulty", difficulty);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const quizWords = useMemo(() => shuffle(allWords).slice(0, 5), [allWords, state]);
  const shuffledDefs = useMemo(() => shuffle(quizWords.map(w => ({ id: w.id, definition: w.definition }))), [quizWords]);

  const handleWordClick = (wordId: string) => {
    if (matches[wordId]) return;
    setSelectedWord(selectedWord === wordId ? null : wordId);
  };

  const handleDefClick = useCallback((defWordId: string) => {
    if (!selectedWord) return;
    setMatches(prev => ({ ...prev, [selectedWord]: defWordId }));
    setSelectedWord(null);
  }, [selectedWord]);

  const handleSubmit = async () => {
    let correct = 0;
    quizWords.forEach(w => {
      if (matches[w.id] === w.id) correct++;
    });
    const total = quizWords.length;
    setResults({ correct, total });
    setState("results");
  };

  const startQuiz = () => {
    setMatches({});
    setSelectedWord(null);
    setResults(null);
    setState("playing");
  };

  if (state === "setup") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-normal tracking-tight">Matching Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">Match words with their definitions.</p>
              <div className="flex gap-1.5 flex-wrap">
                {["all", "easy", "medium", "hard"].map(d => (
                  <Button key={d} variant={difficulty === d ? "default" : "outline"} size="sm" onClick={() => setDifficulty(d)} className="text-xs">
                    {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
                  </Button>
                ))}
              </div>
              <Button className="w-full" onClick={startQuiz} disabled={allWords.length < 2}>
                <Play className="mr-2 h-3.5 w-3.5" /> Start ({Math.min(5, allWords.length)} words)
              </Button>
              {allWords.length < 2 && <p className="text-xs text-destructive">Need at least 2 words.</p>}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (state === "results" && results) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-card border border-border text-center">
            <CardContent className="p-8 space-y-6">
              <div className="text-5xl font-normal tracking-tight">{results.correct}/{results.total}</div>
              <p className="text-sm text-muted-foreground">
                {results.correct === results.total ? "Perfect score!" : results.correct > results.total / 2 ? "Great job!" : "Keep practicing."}
              </p>
              <div className="space-y-2 text-left">
                {quizWords.map(w => (
                  <div key={w.id} className="flex items-center gap-2 text-sm">
                    {matches[w.id] === w.id ? <CheckCircle2 className="h-3.5 w-3.5 text-foreground" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="font-medium capitalize">{w.word}</span>
                    <span className="text-muted-foreground text-xs">— {w.definition.slice(0, 50)}…</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={startQuiz}>
                  <RotateCcw className="mr-2 h-3.5 w-3.5" /> Retry
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setState("setup")}>
                  New Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const allMatched = Object.keys(matches).length === quizWords.length;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-2xl font-normal mb-6 tracking-tight">Match the Words</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3 font-sans">Words</h3>
          <AnimatePresence>
            {quizWords.map(w => (
              <motion.div key={w.id} layout>
                <Button
                  variant={matches[w.id] ? "secondary" : selectedWord === w.id ? "default" : "outline"}
                  className={`w-full justify-start capitalize text-left h-auto py-3 px-4 text-sm ${
                    matches[w.id] ? "opacity-50" : ""
                  }`}
                  onClick={() => handleWordClick(w.id)}
                  disabled={!!matches[w.id]}
                >
                  {w.word}
                  {matches[w.id] && <Badge variant="outline" className="ml-auto text-[10px]">matched</Badge>}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3 font-sans">Definitions</h3>
          {shuffledDefs.map(d => {
            const isUsed = Object.values(matches).includes(d.id);
            return (
              <Button
                key={d.id}
                variant={isUsed ? "secondary" : "outline"}
                className={`w-full justify-start text-left h-auto py-3 px-4 whitespace-normal text-sm ${
                  isUsed ? "opacity-50" : ""
                } ${selectedWord && !isUsed ? "border-foreground/30" : ""}`}
                onClick={() => handleDefClick(d.id)}
                disabled={isUsed || !selectedWord}
              >
                <span className="line-clamp-2">{d.definition}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-8">
        <Button onClick={handleSubmit} disabled={!allMatched}>
          Submit Answers
        </Button>
      </div>
    </div>
  );
}
