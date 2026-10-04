import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Prepare uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer storage
  const storageConfig = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      const safeName = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    }
  });

  const upload = multer({
    storage: storageConfig,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  });

  // Serve uploaded images statically
  app.use('/uploads', express.static(uploadsDir));

  // Use CORS to allow credentials from the frontend
  app.use(cors({
    origin: true,
    credentials: true
  }));

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  // Log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Image Upload API route (supports single or multiple files)
  app.post("/api/upload", upload.any(), (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier reçu" });
      }
      const urls = files.map(f => `/uploads/${f.filename}`);
      console.log(`Uploaded ${files.length} file(s) successfully:`, urls);
      return res.json({ url: urls[0], urls });
    } catch (err: any) {
      console.error("Upload handler error:", err);
      return res.status(500).json({ error: err.message || "Erreur lors de l'enregistrement du fichier" });
    }
  });

  // Global error handler for API routes
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Une erreur interne est survenue"
    });
  });

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
