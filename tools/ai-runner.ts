#!/usr/bin/env node
import { readFile } from "fs/promises";
import { readdir } from "fs/promises";
import { stat } from "fs/promises";
import path from "path";

async function readJobsYaml(filePath: string): Promise<string> {
  const raw = await readFile(filePath, "utf8");
  return raw;
}

function parseJobs(yamlText: string): Array<any> {
  // Very small YAML-ish parser tailored to the `.ai/jobs.yaml` structure used here.
  // Finds job blocks starting with "- id: <id>" and extracts simple keys.
  const jobs: Array<any> = [];
  // Normalize line endings
  const text = yamlText.replace(/\r\n/g, "\n");
  // Find the jobs: section
  const jobsIndex = text.indexOf("\njobs:");
  if (jobsIndex === -1) return jobs;
  const jobsText = text.slice(jobsIndex + "\njobs:".length).trim();

  // Split on new top-level '- ' entries
  const entries = jobsText
    .split(/\n\s*-\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const entry of entries) {
    const job: Record<string, any> = {};
    const lines = entry.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // key: value
      const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
      if (kv) {
        const key = kv[1];
        let value = kv[2];
        // If value starts with a quote, strip surrounding quotes
        value = value.replace(/^"/, "").replace(/"$/, "");
        if (value === "") {
          // potentially a block like steps:, context_paths:
          if (
            key === "context_paths" ||
            key === "inputs" ||
            key === "steps" ||
            key === "outputs" ||
            key === "steps"
          ) {
            // collect subsequent indented lines starting with '-' or key: ...
            const arr = [];
            let j = i + 1;
            for (; j < lines.length; j++) {
              const l = lines[j];
              if (/^\s*-\s+/.test(l)) {
                arr.push(l.replace(/^\s*-\s+/, "").trim());
              } else if (/^\s{2,}[a-zA-Z0-9_]+:/.test(l)) {
                // nested, stop for simplicity
                break;
              } else if (l.trim() === "") {
                continue;
              } else {
                break;
              }
            }
            job[key] = arr;
            i = j - 1;
            continue;
          }
        }
        job[key] = value;
      }
    }
    if (job.id) jobs.push(job);
  }
  return jobs;
}

async function listFilesRecursive(dir: string, maxDepth = 4): Promise<string[]> {
  const results: string[] = [];
  async function recur(current: string, depth: number) {
    if (depth < 0) return;
    let entries;
    try {
      entries = await readdir(current);
    } catch (err) {
      return;
    }
    for (const e of entries) {
      const full = path.join(current, e);
      // skip node_modules and .git and generated folders
      if (e === "node_modules" || e === ".git" || e === "generated") continue;
      let s;
      try {
        s = await stat(full);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        await recur(full, depth - 1);
      } else {
        results.push(full);
      }
    }
  }
  await recur(dir, maxDepth);
  return results;
}

async function run() {
  const cwd = process.cwd();
  const jobsYamlPath = path.join(cwd, ".ai", "jobs.yaml");

  let raw;
  try {
    raw = await readJobsYaml(jobsYamlPath);
  } catch (err) {
    console.error(
      "Could not read .ai/jobs.yaml:",
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  }

  const jobs = parseJobs(raw);

  const arg = process.argv[2];
  if (!arg || arg === "list") {
    console.log("Available jobs:");
    for (const j of jobs) {
      console.log(`- ${j.id}${j.description ? " — " + j.description : ""}`);
    }
    console.log("\nUsage: node tools/ai-runner.js <job_id>");
    process.exit(0);
  }

  const job = jobs.find((j) => j.id === arg);
  if (!job) {
    console.error("Job not found:", arg);
    process.exit(2);
  }

  console.log("Job:", job.id);
  if (job.description) console.log("Description:", job.description);
  if (job.trigger) console.log("Trigger:", job.trigger);

  if (job.context_paths && job.context_paths.length) {
    console.log("\nContext paths:");
    for (const p of job.context_paths) {
      const resolved = path.join(cwd, p.replace(/^\./, "").replace(/^\//, ""));
      console.log(" -", p, "->", resolved);
      try {
        const files = await listFilesRecursive(resolved);
        console.log(`   ${files.length} files (examples):`);
        for (const f of files.slice(0, 10)) console.log("     ", path.relative(cwd, f));
        if (files.length > 10) console.log("     ...", files.length - 10, "more");
      } catch (err) {
        console.log("   (could not list files)", err instanceof Error ? err.message : String(err));
      }
    }
  }

  if (job.steps && job.steps.length) {
    console.log("\nSteps:");
    for (const s of job.steps) {
      console.log(" -", s);
      // detect run_action: or run_action path style
      const m = s.match(/run_action:\s*(.*)/);
      if (m) {
        const actionPathRaw = m[1].trim();
        // resolve relative to .ai
        const actionPath = path.join(cwd, ".ai", actionPathRaw.replace(/^actions\//, "actions/"));
        try {
          const content = await readFile(actionPath, "utf8");
          console.log("\n--- Action file content:", actionPath, "---");
          console.log(content.split("\n").slice(0, 200).join("\n"));
          console.log("--- end action ---\n");
        } catch (err) {
          console.log(
            "   (could not read action file)",
            actionPath,
            err instanceof Error ? err.message : String(err)
          );
        }
      }
    }
  }

  console.log("\nDone. This runner is a lightweight helper — it does not execute shell steps.");
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
