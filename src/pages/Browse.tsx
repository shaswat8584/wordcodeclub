import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import WordCard from "@/components/WordCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const difficulties = ["all", "easy", "medium", "hard"] as const;

export default function Browse() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: words = [], isLoading } = useQuery({
    queryKey: ["browse-words", filter, search],
    queryFn: async () => {
      let q = supabase.from("words").select("*").order("word", { ascending: true });
      if (filter !== "all") q = q.eq("difficulty", filter);
      if (search.trim()) q = q.ilike("word", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Browse Words</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {difficulties.map(d => (
            <Button
              key={d}
              variant={filter === d ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(d)}
              className={filter === d ? "gradient-btn" : ""}
            >
              {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : words.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No words found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {words.map(w => <WordCard key={w.id} word={w} />)}
        </div>
      )}
    </div>
  );
}
