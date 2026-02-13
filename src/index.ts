import "dotenv/config";
import express from "express";
import cors from "cors";
import categoriesRouter from "./routes/categories";
import productsRouter from "./routes/products";
import tireBrandsRouter from "./routes/tire-brands";
import tireModelsRouter from "./routes/tire-models";
import tireIndicesRouter from "./routes/tire-indices";
import counterpartiesRouter from "./routes/counterparties";
import unitsRouter from "./routes/units";
import autoSubcategoriesRouter from "./routes/auto-subcategories";
import ordersRouter from "./routes/orders";
import stockRouter from "./routes/stock";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/tire-brands", tireBrandsRouter);
app.use("/api/tire-models", tireModelsRouter);
app.use("/api/tire-indices", tireIndicesRouter);
app.use("/api/counterparties", counterpartiesRouter);
app.use("/api/units", unitsRouter);
app.use("/api/auto-subcategories", autoSubcategoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/stock", stockRouter);

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

const port = Number(process.env.PORT || 3001);

const start = async () => {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
