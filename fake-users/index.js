import "dotenv/config";
import express from "express";
import router from "./routes/user-route.js";
const app = express();
const PORT = process.env.PORT || 3001;
app.get("/health", (req, res) => {
  res.json({ status: "ok", instance: process.env.INSTANCE_NAME || "A" });
});

app.use("/user", router);
app.listen(PORT, () =>
  console.log(
    `users instance ${process.env.INSTANCE_NAME || "A"} on PORT ${PORT}`,
  ),
);
