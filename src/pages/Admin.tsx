import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Lock, Pencil, Trash2, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADMIN_PASSWORD = "wordvault2024";

interface WordRow {
  id: string;
  word: string;
  definition: string;
  example_sentence: string | null;
  difficulty: string;
  created_at: string;
  user_id: string | null;
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WordRow>>({});
  const queryClient = useQueryClient();

  const { data: words = [], isLoading } = useQuery({
    queryKey: ["admin-words"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("words")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WordRow[];
    },
    enabled: authenticated,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      toast({ title: "Wrong password", variant: "destructive" });
    }
  };

  const startEdit = (word: WordRow) => {
    setEditingId(word.id);
    setEditForm({
      word: word.word,
      definition: word.definition,
      example_sentence: word.example_sentence,
      difficulty: word.difficulty,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("words")
      .update({
        word: editForm.word,
        definition: editForm.definition,
        example_sentence: editForm.example_sentence || null,
        difficulty: editForm.difficulty,
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Word updated!" });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-words"] });
      queryClient.invalidateQueries({ queryKey: ["words"] });
    }
  };

  const deleteWord = async (id: string, word: string) => {
    if (!confirm(`Delete "${word}"?`)) return;
    const { error } = await supabase.from("words").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `"${word}" deleted` });
      queryClient.invalidateQueries({ queryKey: ["admin-words"] });
      queryClient.invalidateQueries({ queryKey: ["words"] });
    }
  };

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-sm">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader className="text-center">
              <Lock className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle>Admin Access</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit" className="w-full gradient-btn">
                  Unlock
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        <span className="gradient-text">Admin</span> — Manage Words
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : words.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No words in the vault.</p>
      ) : (
        <div className="space-y-3">
          {words.map((w) => (
            <Card key={w.id} className="glass-card">
              <CardContent className="p-4">
                {editingId === w.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={editForm.word ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                        placeholder="Word"
                      />
                      <Select
                        value={editForm.difficulty}
                        onValueChange={(v) => setEditForm({ ...editForm, difficulty: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      value={editForm.definition ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, definition: e.target.value })}
                      placeholder="Definition"
                      rows={3}
                    />
                    <Input
                      value={editForm.example_sentence ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, example_sentence: e.target.value })}
                      placeholder="Example sentence (optional)"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(w.id)}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold capitalize">{w.word}</span>
                        <Badge className={`difficulty-${w.difficulty} border-0 text-xs`}>
                          {w.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{w.definition}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(w)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteWord(w.id, w.word)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
