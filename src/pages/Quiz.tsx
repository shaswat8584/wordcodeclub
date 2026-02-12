import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl gradient-text">Matching Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">Match words with their definitions. Select a difficulty to begin.</p>
              <div className="flex gap-2 flex-wrap">
                {["all", "easy", "medium", "hard"].map(d => (
                  <Button key={d} variant={difficulty === d ? "default" : "outline"} onClick={() => setDifficulty(d)}
                    className={difficulty === d ? "gradient-btn" : ""}>
                    {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
                  </Button>
                ))}
              </div>
              <Button className="gradient-btn w-full rounded-full" onClick={startQuiz} disabled={allWords.length < 2}>
                <Play className="mr-2 h-4 w-4" /> Start Quiz ({Math.min(5, allWords.length)} words)
              </Button>
              {allWords.length < 2 && <p className="text-sm text-destructive">Need at least 2 words to start a quiz.</p>}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (state === "results" && results) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="glass-card text-center">
            <CardContent className="p-8 space-y-6">
              <div className="text-6xl font-bold gradient-text">{results.correct}/{results.total}</div>
              <p className="text-lg text-muted-foreground">
                {results.correct === results.total ? "Perfect score! 🎉" : results.correct > results.total / 2 ? "Great job! 👏" : "Keep practicing! 💪"}
              </p>
              <div className="space-y-2">
                {quizWords.map(w => (
                  <div key={w.id} className="flex items-center gap-2 text-sm">
                    {matches[w.id] === w.id ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--easy))]" /> : <XCircle className="h-4 w-4 text-destructive" />}
                    <span className="font-medium capitalize">{w.word}</span>
                    <span className="text-muted-foreground">— {w.definition.slice(0, 50)}...</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="gradient-btn flex-1 rounded-full" onClick={startQuiz}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Try Again
                </Button>
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setState("setup")}>
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
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 gradient-text">Match the Words</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Words</h3>
          <AnimatePresence>
            {quizWords.map(w => (
              <motion.div key={w.id} layout>
                <Button
                  variant={matches[w.id] ? "secondary" : selectedWord === w.id ? "default" : "outline"}
                  className={`w-full justify-start capitalize text-left h-auto py-3 px-4 ${
                    selectedWord === w.id ? "gradient-btn" : ""
                  } ${matches[w.id] ? "opacity-60" : ""}`}
                  onClick={() => handleWordClick(w.id)}
                  disabled={!!matches[w.id]}
                >
                  {w.word}
                  {matches[w.id] && <Badge variant="secondary" className="ml-auto text-xs">matched</Badge>}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Definitions</h3>
          {shuffledDefs.map(d => {
            const isUsed = Object.values(matches).includes(d.id);
            return (
              <Button
                key={d.id}
                variant={isUsed ? "secondary" : "outline"}
                className={`w-full justify-start text-left h-auto py-3 px-4 whitespace-normal ${
                  isUsed ? "opacity-60" : ""
                } ${selectedWord && !isUsed ? "border-primary/50 hover:border-primary" : ""}`}
                onClick={() => handleDefClick(d.id)}
                disabled={isUsed || !selectedWord}
              >
                <span className="line-clamp-2 text-sm">{d.definition}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-8">
        <Button className="gradient-btn rounded-full px-8" onClick={handleSubmit} disabled={!allMatched}>
          Submit Answers
        </Button>
      </div>
    </div>
  );
}
