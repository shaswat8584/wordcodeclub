import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import WordCard from "@/components/WordCard";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface DictionaryResult {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
  }[];
}

export default function Index() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: words = [], isLoading } = useQuery({
    queryKey: ["words", search],
    queryFn: async () => {
      let q = supabase.from("words").select("*").order("created_at", { ascending: false });
      if (search.trim()) {
        q = q.ilike("word", `%${search.trim()}%`);
      } else {
        q = q.limit(12);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: dictResult, isLoading: isDictLoading } = useQuery({
    queryKey: ["dictionary", submittedSearch],
    queryFn: async (): Promise<DictionaryResult | null> => {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(submittedSearch.trim())}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.[0] ?? null;
    },
    enabled: !!submittedSearch.trim() && words.length === 0 && !isLoading,
  });

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      setSubmittedSearch(search.trim());
    }
  };

  const saveToDb = async (dict: DictionaryResult) => {
    setSaving(true);
    const allDefs = dict.meanings.map(m =>
      m.definitions.slice(0, 3).map(d => `(${m.partOfSpeech}) ${d.definition}`).join("; ")
    ).join(" | ");
    const firstExample = dict.meanings
      .flatMap(m => m.definitions)
      .find(d => d.example)?.example ?? null;
    const { error } = await supabase.from("words").insert({
      word: dict.word,
      definition: allDefs,
      example_sentence: firstExample,
      difficulty: "medium",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to save word.", variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: `"${dict.word}" added to your vault.` });
      queryClient.invalidateQueries({ queryKey: ["words"] });
      setSubmittedSearch("");
    }
  };

  const showDictLookup = !!submittedSearch.trim() && words.length === 0 && !isLoading;

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-normal mb-4 tracking-tight">
          WordVault
        </h1>
        <p className="text-muted-foreground max-w-sm mx-auto mb-10">
          A community-powered dictionary. Search, learn, and quiz yourself.
        </p>

        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a word…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-11 h-12 bg-card border border-border rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-foreground/20"
          />
        </div>
      </motion.div>

      {/* Words */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 font-sans">
          {search.trim() ? `Results for "${search}"` : "Recently Added"}
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : showDictLookup ? (
          <div className="py-8">
            {isDictLoading ? (
              <div className="max-w-md mx-auto h-40 rounded-lg bg-muted animate-pulse" />
            ) : dictResult ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
                <Card className="bg-card border border-border">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl capitalize font-normal">{dictResult.word}</CardTitle>
                      {dictResult.phonetic && (
                        <span className="text-muted-foreground text-sm">{dictResult.phonetic}</span>
                      )}
                      <Badge variant="outline" className="ml-auto text-[10px] uppercase tracking-wider">Web</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dictResult.meanings.map((m, i) => (
                      <div key={i}>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1 font-sans">{m.partOfSpeech}</p>
                        <ul className="space-y-1.5">
                          {m.definitions.slice(0, 3).map((d, j) => (
                            <li key={j}>
                              <p className="text-sm leading-relaxed">{d.definition}</p>
                              {d.example && <p className="text-xs text-muted-foreground italic mt-0.5">"{d.example}"</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <button
                      onClick={() => saveToDb(dictResult)}
                      disabled={saving}
                      className="mt-4 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save to WordVault"}
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <p className="text-muted-foreground text-center text-sm">No definition found for "{submittedSearch}".</p>
            )}
          </div>
        ) : words.length === 0 ? (
          <p className="text-muted-foreground text-center py-12 text-sm">No words yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {words.map(w => (
              <WordCard key={w.id} word={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
