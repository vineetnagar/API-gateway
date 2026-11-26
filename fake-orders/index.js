import "dotenv/config";
import express from "express";
import router from "./routes/orderRoute.js";
const app = express();
const PORT = process.env.PORT || 3002;
app.get("/health", (req, res) => {
  res.json({ status: "ok", instance: process.env.INSTANCE_NAME || "A" });
});

app.use("/orders", router);
app.listen(PORT, () => console.log(`server started on PORT ${PORT}`));
