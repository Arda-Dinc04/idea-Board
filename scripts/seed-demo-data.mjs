import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  const entries = {};

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");

    if (index === -1) {
      continue;
    }

    entries[trimmed.slice(0, index)] = trimmed.slice(index + 1).replace(/^"|"$/g, "");
  }

  return entries;
}

const env = loadEnvFile(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const builders = ["AD", "YanLeCunn", "Tim", "Texas", "Miami"];
const admins = [
  ["ardadinc04@gmail.com", "AD", "ad"],
  ["luanthony523@gmail.com", "YanLeCunn", "yanlecunn"],
  ["yanzewu88@gmail.com", "Tim", "tim"],
];

function normalizeName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

async function upsertAdminUsers() {
  const { error } = await supabase.from("admin_users").upsert(
    admins.map(([email, display_name, normalized_name]) => ({
      email,
      display_name,
      normalized_name,
    })),
    { onConflict: "email" },
  );

  if (error) {
    console.log(`Skipped admin_users seed: ${error.message}`);
  }
}

async function upsertBuilders() {
  const { error } = await supabase.from("builders").upsert(
    builders.map((display_name) => ({
      display_name,
      normalized_name: normalizeName(display_name),
    })),
    { onConflict: "normalized_name" },
  );

  if (error) {
    throw error;
  }

  const { data, error: selectError } = await supabase.from("builders").select("*");

  if (selectError) {
    throw selectError;
  }

  return new Map(data.map((builder) => [builder.display_name, builder]));
}

async function ensureBoard({ title, starts_at, ends_at, is_active }) {
  if (is_active) {
    await supabase.from("week_boards").update({ is_active: false }).eq("is_active", true);
  }

  const { data: existing, error: existingError } = await supabase
    .from("week_boards")
    .select("*")
    .eq("starts_at", starts_at)
    .eq("ends_at", ends_at)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { data, error } = await supabase
      .from("week_boards")
      .update({ title, is_active })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("week_boards")
    .insert({ title, starts_at, ends_at, is_active })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function ensureIdea(board, idea) {
  const { data: existing, error: existingError } = await supabase
    .from("ideas")
    .select("*")
    .eq("board_id", board.id)
    .eq("idea_text", idea.idea_text)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { data, error } = await supabase
      .from("ideas")
      .update({
        submitter_name: idea.submitter_name,
        normalized_submitter_name: normalizeName(idea.submitter_name),
        category: idea.category,
        status: idea.status,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      board_id: board.id,
      idea_text: idea.idea_text,
      submitter_name: idea.submitter_name,
      normalized_submitter_name: normalizeName(idea.submitter_name),
      category: idea.category,
      status: idea.status,
      created_at: idea.created_at,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function assignBuilders(idea, names, builderByName) {
  for (const name of names) {
    const builder = builderByName.get(name);

    if (!builder) {
      continue;
    }

    const { error } = await supabase.from("idea_assignments").upsert(
      {
        idea_id: idea.id,
        builder_id: builder.id,
      },
      { onConflict: "idea_id,builder_id", ignoreDuplicates: true },
    );

    if (error) {
      throw error;
    }
  }
}

async function addStars(idea, count) {
  const fakeAdminIds = [
    "00000000-0000-4000-8000-000000000001",
    "00000000-0000-4000-8000-000000000002",
    "00000000-0000-4000-8000-000000000003",
  ];

  for (const admin_user_id of fakeAdminIds.slice(0, count)) {
    const { error } = await supabase.from("idea_stars").upsert(
      {
        idea_id: idea.id,
        admin_user_id,
      },
      { onConflict: "idea_id,admin_user_id", ignoreDuplicates: true },
    );

    if (error) {
      throw error;
    }
  }
}

async function completeIdea(idea, completion) {
  const { error: completionError } = await supabase.from("idea_completions").upsert(
    {
      idea_id: idea.id,
      ...completion,
    },
    { onConflict: "idea_id" },
  );

  if (completionError) {
    throw completionError;
  }

  const { error: ideaError } = await supabase
    .from("ideas")
    .update({ status: "completed" })
    .eq("id", idea.id);

  if (ideaError) {
    throw ideaError;
  }
}

await upsertAdminUsers();
const builderByName = await upsertBuilders();

const currentBoard = await ensureBoard({
  title: "Week of Apr 27",
  starts_at: "2026-04-27",
  ends_at: "2026-05-03",
  is_active: true,
});

const previousBoard = await ensureBoard({
  title: "Week of Apr 20",
  starts_at: "2026-04-20",
  ends_at: "2026-04-26",
  is_active: false,
});

const ideas = [
  {
    board: currentBoard,
    status: "submitted",
    submitter_name: "Maya",
    category: "AI Tool",
    created_at: "2026-04-27T15:15:00Z",
    stars: 2,
    idea_text:
      "A campus errand bot where students post tiny tasks like printing notes, grabbing coffee, or lending a charger. It ranks requests by urgency, distance, and weirdness so useful micro-help gets matched fast.",
  },
  {
    board: currentBoard,
    status: "submitted",
    submitter_name: "Jon",
    category: "Game",
    created_at: "2026-04-27T18:30:00Z",
    stars: 1,
    idea_text:
      "A browser game where four friends run a chaotic pop-up restaurant and every order mutates the controls. The hook is that players shout roles, swap stations, and survive a dinner rush that keeps changing rules.",
  },
  {
    board: currentBoard,
    status: "submitted",
    submitter_name: "Nina",
    category: "Useless but Funny",
    created_at: "2026-04-28T02:05:00Z",
    stars: 3,
    idea_text:
      "A fake productivity dashboard that congratulates you for avoiding bad ideas. It tracks deleted notes, abandoned tabs, and almost-sent texts, turning restraint into funny badges for people who overbuild everything.",
  },
  {
    board: currentBoard,
    status: "working",
    submitter_name: "Priya",
    category: "Startup",
    created_at: "2026-04-28T13:00:00Z",
    stars: 2,
    builders: ["AD", "YanLeCunn"],
    idea_text:
      "A lunch radar for campus that pulls specials, wait times, and friend check-ins into one map. Students use it when they have twenty minutes and want the best food option without opening five separate apps.",
  },
  {
    board: currentBoard,
    status: "completed",
    submitter_name: "Leo",
    category: "Website",
    created_at: "2026-04-28T16:20:00Z",
    stars: 3,
    builders: ["Tim"],
    completion: {
      deployment_url: "https://example.com/receipt-roast",
      github_url: "https://github.com/example/receipt-roast",
      twitter_url: "https://x.com/example/status/123",
      notes: "Demo shipped with image upload, roast copy, and a shareable result page.",
      completed_at: "2026-04-28T20:00:00Z",
    },
    idea_text:
      "A receipt roast website where people upload a shopping receipt and get a dramatic breakdown of their decisions. It is for friend groups who want a funny shareable page after every questionable purchase.",
  },
  {
    board: previousBoard,
    status: "submitted",
    submitter_name: "Sam",
    category: "Social",
    created_at: "2026-04-21T12:00:00Z",
    stars: 1,
    idea_text:
      "A tiny social app for making one-day clubs around oddly specific moods like rainy study mode or post-exam pancakes. People join for a day, post a plan, then the club disappears the next morning.",
  },
  {
    board: previousBoard,
    status: "working",
    submitter_name: "Avery",
    category: "AI Tool",
    created_at: "2026-04-22T17:10:00Z",
    stars: 2,
    builders: ["Texas"],
    idea_text:
      "An AI tool that converts messy voice notes into a clean build brief with target user, core feature, and first prototype task. It is for builders who think out loud but need structure quickly.",
  },
  {
    board: previousBoard,
    status: "completed",
    submitter_name: "Riley",
    category: "Website",
    created_at: "2026-04-24T19:45:00Z",
    stars: 3,
    builders: ["AD", "Tim"],
    completion: {
      deployment_url: "https://example.com/weekend-name-lab",
      github_url: "https://github.com/example/weekend-name-lab",
      twitter_url: null,
      notes: "Completed MVP with generator, saved favorites, and a lightweight gallery.",
      completed_at: "2026-04-26T21:30:00Z",
    },
    idea_text:
      "A weekend project name generator that takes the vibe, audience, and absurd constraint, then returns launch-ready names. The hook is a board of names ranked by weirdness and memorability.",
  },
];

for (const ideaInput of ideas) {
  const idea = await ensureIdea(ideaInput.board, ideaInput);
  await addStars(idea, ideaInput.stars ?? 0);

  if (ideaInput.builders) {
    await assignBuilders(idea, ideaInput.builders, builderByName);
  }

  if (ideaInput.completion) {
    await completeIdea(idea, ideaInput.completion);
  }
}

console.log("Demo data seeded.");
