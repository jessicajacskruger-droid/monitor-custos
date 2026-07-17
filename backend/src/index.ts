import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";

import importRoutes from "./routes/importRoutes";
import variationRoutes from "./routes/variationRoutes";
import justificationTypeRoutes from "./routes/justificationTypeRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import exportRoutes from "./routes/exportRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "*").split(",").map((s) => s.trim());
app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
  })
);
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/import", importRoutes);
app.use("/api/variations", variationRoutes);
app.use("/api/justification-types", justificationTypeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/export", exportRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3333;
app.listen(PORT, () => {
  console.log(`Monitor de Custos API rodando na porta ${PORT}`);
});
