import "dotenv/config";
import express from "express";
import router from "./routes/orderRoute.js";
const app = express();
const PORT = process.env.PORT || 3000;

app.use("/orders", router);
app.listen(PORT, () => console.log("server started"));
