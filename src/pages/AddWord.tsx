import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function AddWord() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [difficulty, setDifficulty] = useState("medium");

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">You need to sign in to add words.</p>
        <Button className="gradient-btn rounded-full" asChild><Link to="/auth">Sign In</Link></Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !definition.trim()) {
      toast.error("Word and definition are required.");
      return;
    }
    if (word.trim().length > 100 || definition.trim().length > 1000 || example.trim().length > 500) {
      toast.error("Input too long.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("words").insert({
      word: word.trim().toLowerCase(),
      definition: definition.trim(),
      example_sentence: example.trim() || null,
      difficulty,
      user_id: user.id,
    });
    setLoading(false);

    if (error) {
      if (error.code === "23505") toast.error("This word already exists!");
      else toast.error("Failed to add word.");
      return;
    }

    toast.success("Word added successfully!");
    navigate("/");
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl gradient-text">Add a New Word</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="word">Word</Label>
                <Input id="word" placeholder="e.g. serendipity" value={word} onChange={e => setWord(e.target.value)} maxLength={100} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="definition">Definition</Label>
                <Textarea id="definition" placeholder="What does it mean?" value={definition} onChange={e => setDefinition(e.target.value)} maxLength={1000} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="example">Example Sentence (optional)</Label>
                <Textarea id="example" placeholder="Use it in a sentence..." value={example} onChange={e => setExample(e.target.value)} maxLength={500} />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">🟢 Easy</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="hard">🔴 Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="gradient-btn w-full rounded-full" disabled={loading}>
                {loading ? "Adding..." : "Add Word"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
