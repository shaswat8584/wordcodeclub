import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");

    if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all data in parallel
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [profilesRes, wordsRes, wordsTodayRes, recentWordsRes] =
      await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("words").select("id, difficulty, created_at, user_id"),
        supabase
          .from("words")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayStart),
        supabase
          .from("words")
          .select("id, word, difficulty, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    const totalUsers = profilesRes.count ?? 0;
    const allWords = wordsRes.data ?? [];
    const totalWords = allWords.length;
    const wordsToday = wordsTodayRes.count ?? 0;
    const avgPerUser = totalUsers > 0 ? Math.round((totalWords / totalUsers) * 10) / 10 : 0;

    // Words by date (last 30 days)
    const dateCounts: Record<string, number> = {};
    for (const w of allWords) {
      const d = w.created_at.slice(0, 10);
      if (d >= thirtyDaysAgo.slice(0, 10)) {
        dateCounts[d] = (dateCounts[d] || 0) + 1;
      }
    }
    const wordsByDate = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Difficulty breakdown
    const diffMap: Record<string, number> = {};
    for (const w of allWords) {
      diffMap[w.difficulty] = (diffMap[w.difficulty] || 0) + 1;
    }
    const difficultyBreakdown = Object.entries(diffMap).map(
      ([difficulty, count]) => ({ difficulty, count })
    );

    // Get profile display names for recent words and top users
    const userIds = [
      ...new Set([
        ...(recentWordsRes.data ?? []).map((w) => w.user_id).filter(Boolean),
        ...allWords.map((w) => w.user_id).filter(Boolean),
      ]),
    ];

    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        profileMap[p.id] = p.display_name ?? "Anonymous";
      }
    }

    const recentWords = (recentWordsRes.data ?? []).map((w) => ({
      word: w.word,
      difficulty: w.difficulty,
      displayName: profileMap[w.user_id] ?? "Unknown",
      createdAt: w.created_at,
    }));

    // Top users by word count
    const userWordCounts: Record<string, { count: number; latest: string }> = {};
    for (const w of allWords) {
      if (!w.user_id) continue;
      if (!userWordCounts[w.user_id]) {
        userWordCounts[w.user_id] = { count: 0, latest: w.created_at };
      }
      userWordCounts[w.user_id].count++;
      if (w.created_at > userWordCounts[w.user_id].latest) {
        userWordCounts[w.user_id].latest = w.created_at;
      }
    }
    const topUsers = Object.entries(userWordCounts)
      .map(([userId, { count, latest }]) => ({
        displayName: profileMap[userId] ?? "Unknown",
        wordCount: count,
        latestActivity: latest,
      }))
      .sort((a, b) => b.wordCount - a.wordCount)
      .slice(0, 10);

    return new Response(
      JSON.stringify({
        stats: { totalUsers, totalWords, wordsToday, avgPerUser },
        wordsByDate,
        difficultyBreakdown,
        recentWords,
        topUsers,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
