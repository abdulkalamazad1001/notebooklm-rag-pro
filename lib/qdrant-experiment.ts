import fs from "fs";
import path from "path";

/**
 * Qdrant Vector Database Experiment
 * Developed by Abdul Kalam Azad
 */

// --- SIMPLE ENV LOADER ---
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const [key, ...value] = line.split("=");
      if (key && value) {
        process.env[key.trim()] = value.join("=").trim();
      }
    });
  }
}
loadEnv();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = "research_notebooks";

/**
 * Ensures the Qdrant collection exists.
 */
export async function initQdrantCollection() {
  if (!QDRANT_URL || !QDRANT_API_KEY) {
    throw new Error("Missing QDRANT_URL or QDRANT_API_KEY in .env.local");
  }

  console.log("🔍 Checking Qdrant collection...");
  
  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
    headers: { "api-key": QDRANT_API_KEY! }
  });

  if (res.status === 404) {
    console.log("🏗️ Creating new Qdrant collection...");
    const createRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "api-key": QDRANT_API_KEY! 
      },
      body: JSON.stringify({
        vectors: {
          size: 1024,
          distance: "Cosine"
        }
      })
    });
    const data = await createRes.json();
    console.log("✅ Collection created:", data.status);
  } else {
    console.log("✅ Collection already exists.");
  }
}

/**
 * Upserts real document chunks into Qdrant.
 */
export async function uploadToQdrant(notebookId: string, chunks: any[], embeddings: number[][]) {
  console.log(`📤 Uploading ${chunks.length} chunks to Qdrant for notebook: ${notebookId}`);
  
  const points = chunks.map((chunk, i) => ({
    id: crypto.randomUUID(),
    vector: embeddings[i],
    payload: {
      notebookId,
      text: chunk.text,
      index: chunk.index
    }
  }));

  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "api-key": QDRANT_API_KEY!
    },
    body: JSON.stringify({ points })
  });

  return await res.json();
}

/**
 * Searches for the top-k most similar chunks in Qdrant.
 */
export async function searchQdrant(queryVector: number[], limit = 5) {
  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": QDRANT_API_KEY!
    },
    body: JSON.stringify({
      vector: queryVector,
      limit,
      with_payload: true
    })
  });

  const data = await res.json();
  return data.result || [];
}

/**
 * --- TEST FUNCTIONS FOR SCRATCH RUNS ---
 */
export async function uploadTestPoint() {
  console.log("📤 Uploading test point to Qdrant...");
  const dummyVector = new Array(1024).fill(0).map(() => Math.random());
  await uploadToQdrant("test-notebook", [{ text: "Test chunk", index: 0 }], [dummyVector]);
  return dummyVector;
}

if (import.meta.url.endsWith(path.basename(process.argv[1] || ""))) {
  (async () => {
    try {
      await initQdrantCollection();
      const vector = await uploadTestPoint();
      const results = await searchQdrant(vector, 1);
      console.log("🏆 Search Result:", JSON.stringify(results[0]?.payload, null, 2));
      console.log("\n🚀 QDRANT EXPERIMENT SUCCESSFUL!");
    } catch (err) {
      console.error("\n❌ EXPERIMENT FAILED:", err);
    }
  })();
}
