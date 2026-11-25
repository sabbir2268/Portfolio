const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI;
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoDb = process.env.MONGO_DB || "projectsDB";
const firebaseApiKey =
  process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const adminEmail = process.env.ADMIN_EMAIL;

const dataFile = path.join(__dirname, "data", "projects.json");

let client;
let projectsCollection;

async function readProjectsFile() {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeProjectsFile(projects) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(projects, null, 2), "utf8");
}

const store = {
  async list() {
    if (projectsCollection) return projectsCollection.find().toArray();
    return readProjectsFile();
  },

  async add(project) {
    if (projectsCollection) {
      const result = await projectsCollection.insertOne(project);
      return { ...project, _id: result.insertedId };
    }

    const projects = await readProjectsFile();
    const saved = { _id: new ObjectId().toString(), ...project };
    projects.push(saved);
    await writeProjectsFile(projects);
    return saved;
  },

  async update(id, patch) {
    if (projectsCollection) {
      const filter = { _id: new ObjectId(id) };
      const result = await projectsCollection.updateOne(filter, {
        $set: patch,
      });
      if (!result.matchedCount) return result;
      const project = await projectsCollection.findOne(filter);
      return { ...result, project };
    }

    const projects = await readProjectsFile();
    const index = projects.findIndex((project) => String(project._id) === id);
    if (index === -1) return { matchedCount: 0 };

    projects[index] = { ...projects[index], ...patch };
    await writeProjectsFile(projects);
    return { matchedCount: 1, project: projects[index] };
  },

  async remove(id) {
    if (projectsCollection) {
      return projectsCollection.deleteOne({ _id: new ObjectId(id) });
    }

    const projects = await readProjectsFile();
    const remaining = projects.filter(
      (project) => String(project._id) !== id,
    );
    if (remaining.length === projects.length) return { deletedCount: 0 };

    await writeProjectsFile(remaining);
    return { deletedCount: 1 };
  },
};

async function verifyAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Admin sign-in required",
    });
  }

  if (!firebaseApiKey) {
    return res.status(500).json({
      success: false,
      message:
        "Server is missing FIREBASE_API_KEY. Add it to server/.env and restart.",
    });
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      },
    );
    const data = await response.json();
    const user = data.users && data.users[0];

    if (!response.ok || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. Sign in again.",
      });
    }

    if (adminEmail && user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "This account is not allowed to manage the portfolio.",
      });
    }

    req.admin = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/projects", async (req, res) => {
  try {
    res.send(await store.list());
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/projects", verifyAdmin, async (req, res) => {
  try {
    const { name, description, technologies, categories, github, live } =
      req.body;

    const newProject = {
      name,
      description,
      technologies: parseList(technologies),
      categories: parseList(categories),
      github,
      live,
    };

    const saved = await store.add(newProject);
    console.log("Project added successfully", saved._id);
    res.status(201).json({
      success: true,
      message: "Project added successfully",
      insertedId: saved._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add project",
      error: error.message,
    });
  }
});

app.delete("/projects/:id", verifyAdmin, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const result = await store.remove(req.params.id);
    if (result.deletedCount === 1) {
      res.json({ success: true, message: "Project deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Project not found" });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error: error.message,
    });
  }
});

app.put("/projects/:id", verifyAdmin, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const { name, description, technologies, categories, github, live } =
      req.body;

    const result = await store.update(req.params.id, {
      name,
      description,
      technologies: parseList(technologies),
      categories: parseList(categories),
      github,
      live,
    });

    if (result.matchedCount === 1) {
      res.json({
        success: true,
        message: "Project updated successfully",
        project: result.project,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: error.message,
    });
  }
});

async function connectToDatabase() {
  if (!mongoUri && (!mongoUser || !mongoPass)) {
    console.log(
      "MongoDB not configured. Using local JSON store: server/data/projects.json",
    );
    return;
  }

  const uri =
    mongoUri ||
    `mongodb+srv://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPass)}@portfolio-cluster.vvv4gjc.mongodb.net/?appName=portfolio-cluster`;

  try {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    projectsCollection = client.db(mongoDb).collection("projects");
    console.log(`MongoDB connected successfully (${mongoDb}.projects)`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.log("Falling back to local JSON store");
  }
}

connectToDatabase().finally(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
