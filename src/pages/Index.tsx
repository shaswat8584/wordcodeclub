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

  // Save the dictionary result to DB
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
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          <span className="gradient-text">WordVault</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
          A community-powered dictionary. Search, learn, and quiz yourself.
        </p>

        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          <Input
            placeholder="Search for a word and press Enter..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 h-14 text-lg rounded-full bg-card border border-border shadow-md focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </motion.div>

      {/* Words grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {search.trim() ? `Results for "${search}"` : "Recently Added"}
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : showDictLookup ? (
          <div className="py-8">
            {isDictLoading ? (
              <div className="max-w-xl mx-auto h-40 rounded-lg bg-muted animate-pulse" />
            ) : dictResult ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl capitalize">{dictResult.word}</CardTitle>
                      {dictResult.phonetic && (
                        <span className="text-muted-foreground text-sm">{dictResult.phonetic}</span>
                      )}
                      <Badge variant="outline" className="ml-auto text-xs">From Web</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dictResult.meanings.map((m, i) => (
                      <div key={i}>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{m.partOfSpeech}</p>
                        <ul className="space-y-2">
                          {m.definitions.slice(0, 3).map((d, j) => (
                            <li key={j}>
                              <p className="text-sm">{d.definition}</p>
                              {d.example && <p className="text-xs text-muted-foreground italic mt-0.5">"{d.example}"</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <button
                      onClick={() => saveToDb(dictResult)}
                      disabled={saving}
                      className="mt-4 w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save to WordVault"}
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <p className="text-muted-foreground text-center">No definition found for "{submittedSearch}". Try a different word!</p>
            )}
          </div>
        ) : words.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No words yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {words.map(w => (
              <WordCard key={w.id} word={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
