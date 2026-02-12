import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import WordCard from "@/components/WordCard";
import { motion } from "framer-motion";

export default function Index() {
  const [search, setSearch] = useState("");

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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for a word..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-14 text-lg rounded-full glass-card border-border/50 focus-visible:ring-primary"
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
        ) : words.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            {search.trim() ? "No words found. Try a different search!" : "No words yet. Be the first to add one!"}
          </p>
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
