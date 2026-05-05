import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import cron from "node-cron";
import axios from "axios";
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load firebase config for basic info
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf-8'));

let dbStatus = "Initializing";
let dbError = "";
let dbInfo = "";

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  try {
    // Try standard ADC initialization first (best for Cloud Run/App Engine)
    admin.initializeApp();
    console.log("Firebase Admin initialized with default credentials.");
  } catch (e) {
    console.warn("Standard Firebase Admin initialization failed, trying with explicit project ID...", e);
    try {
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log(`Firebase Admin initialized with project ID: ${firebaseConfig.projectId}`);
    } catch (e2) {
      console.error("All Firebase Admin initialization attempts failed", e2);
      dbError = "Init failed: " + (e2 instanceof Error ? e2.message : String(e2));
    }
  }
}

import { initializeApp as initializeClientApp, FirebaseApp } from 'firebase/app';
import { getFirestore as getClientFirestore, collection as clientCollection, getDocs as clientGetDocs, limit as clientLimit, query as clientQuery, orderBy as clientOrderBy, doc as clientDoc, Firestore as ClientFirestore } from 'firebase/firestore';

// Target the specific database, or fallback to default
let db: admin.firestore.Firestore | null = null;
let clientDb: ClientFirestore | null = null;

async function initDb() {
  const dbId = firebaseConfig.firestoreDatabaseId;
  dbInfo = `Database ID: ${dbId || '(default)'} | Project: ${firebaseConfig.projectId}`;
  console.log(`Initializing Firestore with ${dbInfo}`);
  
  // Try Admin SDK with the specified database
  try {
    console.log(`Attempting Admin SDK connection to database: ${dbId || '(default)'}...`);
    const firestore = getFirestore(dbId || undefined);
    
    // Test with a simple get to the matches collection
    // Using a timeout to prevent hanging if there's a weird network issue
    const testDoc = await Promise.race([
      firestore.collection("matches").limit(1).get(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Admin SDK Timeout")), 5000))
    ]) as admin.firestore.QuerySnapshot;
    
    db = firestore;
    dbStatus = "Connected (Admin)";
    console.log("Firestore Admin connected successfully.");
    return;
  } catch (err) {
    console.error(`Admin SDK connection to ${dbId || '(default)'} failed:`, err);
    dbError = "Admin SDK Error: " + (err instanceof Error ? err.message : String(err));
  }

  // Try REST API Fallback (Very robust using API Key)
  try {
    console.log("Attempting REST API fallback...");
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId || '(default)'}/documents/matches?pageSize=1`;
    await axios.get(url, { 
      params: { key: firebaseConfig.apiKey },
      timeout: 5000 
    });
    dbStatus = "Connected (REST)";
    console.log("Firestore REST API connection verified.");
    return;
  } catch (err) {
    console.error("REST API fallback failed:", err);
    dbError += " | REST Error: " + (err instanceof Error ? err.message : String(err));
  }

  // Final fallback to default DB with Admin SDK
  if (dbId) {
    try {
      console.log("Final fallback: Attempting to connect to (default) database with Admin SDK...");
      const fallbackDb = getFirestore();
      await fallbackDb.collection("matches").limit(1).get();
      db = fallbackDb;
      dbStatus = "Connected (Fallback Admin)";
      dbError = "";
      console.log("Firestore (default) Admin connected successfully.");
      return;
    } catch (err) {
      console.error("Default database connection also failed:", err);
      dbError += " | Default Admin Error: " + (err instanceof Error ? err.message : String(err));
      dbStatus = "Failed";
    }
  } else {
    dbStatus = "Failed";
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes FIRST to ensure they match before SPA fallback
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      dbStatus, 
      dbError,
      dbInfo,
      apps: admin.apps.length
    });
  });

  await initDb();

  // Mock data for fallbacks
  const getMockMatches = () => [
    {
      id: "m1",
      title: "India vs Australia - 2nd Test",
      match_type: "Test",
      status: "LIVE",
      venue: "Melbourne Cricket Ground",
      date: new Date().toISOString(),
      team_home: "Australia",
      team_away: "India",
      toss: "India won the toss and elected to bat",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "mock_ipl",
      title: "Mumbai Indians vs CSK - IPL 2026",
      match_type: "T20",
      status: "UPCOMING",
      venue: "Wankhede Stadium",
      date: new Date(Date.now() + 86400000).toISOString(),
      team_home: "Mumbai Indians",
      team_away: "CSK",
      toss: "TBD",
      lastUpdated: new Date().toISOString()
    }
  ];

  const fromFirestoreREST = (doc: any) => {
    const fields = doc.fields || {};
    const result: any = { id: doc.name.split("/").pop() };
    for (const [key, value] of Object.entries(fields)) {
      const v: any = value;
      if (v.stringValue !== undefined) result[key] = v.stringValue;
      else if (v.integerValue !== undefined) result[key] = parseInt(v.integerValue);
      else if (v.doubleValue !== undefined) result[key] = parseFloat(v.doubleValue);
      else if (v.booleanValue !== undefined) result[key] = v.booleanValue;
      else if (v.timestampValue !== undefined) result[key] = v.timestampValue;
      else if (v.mapValue !== undefined) result[key] = fromFirestoreREST({ fields: v.mapValue.fields });
      else if (v.arrayValue !== undefined) result[key] = (v.arrayValue.values || []).map((val: any) => fromFirestoreREST({ fields: { item: val } }).item);
    }
    return result;
  };

  app.get("/api/matches", async (req, res) => {
    try {
      if (dbStatus === "Failed") {
        console.warn("DB failed, returning mock matches.");
        return res.json(getMockMatches());
      }
      
      let matches: any[] = [];
      if (dbStatus.includes("Admin")) {
        const snapshot = await db!.collection("matches").orderBy("date", "asc").get();
        matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else if (dbStatus === "Connected (REST)") {
        const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
        const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/matches`;
        const response = await axios.get(url, { params: { key: firebaseConfig.apiKey } });
        matches = (response.data.documents || []).map(fromFirestoreREST);
      }
      
      if (matches.length === 0) {
        return res.json(getMockMatches());
      }
      res.json(matches);
    } catch (error) {
      console.error("Error in /api/matches:", error);
      res.json(getMockMatches());
    }
  });

  app.get("/api/matches/:id", async (req, res) => {
    const matchId = req.params.id;
    try {
      if (dbStatus === "Failed") {
        return res.json({ id: matchId, players: getMockPlayers(matchId) });
      }
      
      let players: any[] = [];
      if (dbStatus.includes("Admin")) {
        const playersSnapshot = await db!.collection("matches").doc(matchId).collection("players").get();
        players = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else if (dbStatus === "Connected (REST)") {
        const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
        const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/matches/${matchId}/players`;
        const response = await axios.get(url, { params: { key: firebaseConfig.apiKey } });
        players = (response.data.documents || []).map(fromFirestoreREST);
      }
      
      if (players.length === 0) {
        return res.json({ id: matchId, players: getMockPlayers(matchId) });
      }
      res.json({ id: matchId, players });
    } catch (error) {
       console.error("Error in /api/matches/:id:", error);
       res.json({ id: matchId, players: getMockPlayers(matchId) });
    }
  });

  const getMockPlayers = (matchId: string) => [
    { id: "p1", name: "Virat Kohli", team: "India", role: "batsman", recent_form: 8.5, credits: 10.5, selection_percentage: 85 },
    { id: "p2", name: "Steve Smith", team: "Australia", role: "batsman", recent_form: 7.8, credits: 10.0, selection_percentage: 78 },
    { id: "p3", name: "Jasprit Bumrah", team: "India", role: "bowler", recent_form: 9.2, credits: 9.5, selection_percentage: 92 },
    { id: "p4", name: "Pat Cummins", team: "Australia", role: "bowler", recent_form: 8.0, credits: 9.5, selection_percentage: 80 }
  ];

  // Cricket Data Fetcher
  const updateCricketData = async () => {
    console.log("Fetching cricket data engine started...");
    // Only attempt seed if Admin DB is connected (client SDK can't seed without auth)
    if (dbStatus.includes("Connected") && db) {
       await seedData();
    }
  };

  const seedData = async () => {
    if (!db) return;
    try {
      const mockMatches = getMockMatches();
      for (const match of mockMatches) {
        await db.collection("matches").doc(match.id).set(match);
        if (match.id === "m1") {
          const players = getMockPlayers(match.id);
          for (const player of players) {
            await db.collection("matches").doc(match.id).collection("players").doc(player.id).set(player);
          }
        }
      }
      console.log("Data seeded to Firestore via Admin SDK.");
    } catch (e) {
      console.error("Seeding failed (Admin SDK):", e);
    }
  };

  // Schedule task every 5 minutes
  cron.schedule('*/5 * * * *', updateCricketData);
  // Initial run (don't block server start)
  updateCricketData().catch(err => console.error("Initial data fetch failed:", err));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
