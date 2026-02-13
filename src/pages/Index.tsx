import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import WordCard from "@/components/WordCard";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

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
  const [saving, setSaving] = useState(false);
  const [previewWord, setPreviewWord] = useState<DictionaryResult | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: words = [], isLoading } = useQuery({
    queryKey: ["words", search, user?.id],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase.from("words").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (search.trim()) {
        q = q.ilike("word", `%${search.trim()}%`);
      } else {
        q = q.limit(12);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      setSaving(true);
      setPreviewWord(null);
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(search.trim())}`);
        if (!res.ok) {
          toast({
            title: "Not found",
            description: `No definition found for "${search.trim()}".`,
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
        const data = await res.json();
        const dict: DictionaryResult | null = data?.[0] ?? null;
        if (!dict) {
          toast({
            title: "Not found",
            description: `No definition found for "${search.trim()}".`,
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        // If not logged in, just show the preview without saving
        if (!user) {
          setPreviewWord(dict);
          setSaving(false);
          return;
        }

        const allDefs = dict.meanings
          .map((m) =>
            m.definitions
              .slice(0, 3)
              .map((d) => `(${m.partOfSpeech}) ${d.definition}`)
              .join("; "),
          )
          .join(" | ");
        const firstExample = dict.meanings.flatMap((m) => m.definitions).find((d) => d.example)?.example ?? null;
        const { error } = await supabase.from("words").insert({
          word: dict.word,
          definition: allDefs,
          example_sentence: firstExample,
          difficulty: "medium",
          user_id: user.id,
        });
        if (error) {
          toast({ title: "Error", description: "Failed to save word.", variant: "destructive" });
        } else {
          toast({ title: "Saved!", description: `"${dict.word}" added to your vault.` });
          queryClient.invalidateQueries({ queryKey: ["words"] });
          setSearch("");
        }
      } catch {
        toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
      }
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      {/* Hero */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-normal mb-4 tracking-tight">WordVault</h1>
        <p className="text-muted-foreground max-w-sm mx-auto mb-10">
          A personalised dictionary. Search, learn, and quiz yourself.
        </p>

        <div className="relative max-w-md mx-auto">
          {saving ? (
            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            placeholder={user ? "Type a word and press Enter to add…" : "Type a word and press Enter to look up…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="pl-11 h-12 bg-card border border-border rounded-lg text-sm capitalize focus-visible:ring-1 focus-visible:ring-foreground/20"
          />
        </div>
      </motion.div>

      {/* Preview for non-logged-in users */}
      {!user && previewWord && (
        <div className="mb-12">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold capitalize mb-1">{previewWord.word}</h2>
            {previewWord.phonetic && (
              <p className="text-muted-foreground text-sm mb-4">{previewWord.phonetic}</p>
            )}
            {previewWord.meanings.map((m, i) => (
              <div key={i} className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground italic mb-2">{m.partOfSpeech}</h3>
                <ol className="list-decimal list-inside space-y-1.5">
                  {m.definitions.map((d, j) => (
                    <li key={j} className="text-sm">
                      {d.definition}
                      {d.example && (
                        <p className="text-muted-foreground text-xs ml-5 mt-0.5">"{d.example}"</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            <p className="text-muted-foreground text-xs mt-4">
              <Link to="/auth" className="text-foreground underline underline-offset-4">Sign in</Link> to save words to your collection.
            </p>
          </Card>
        </div>
      )}

      {/* Words - only show for logged in users */}
      {user && (
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
          ) : words.length === 0 ? (
            <p className="text-muted-foreground text-center py-12 text-sm">
              No words yet. Type a word above and press Enter.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {words.map((w) => (
                <WordCard key={w.id} word={w} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
