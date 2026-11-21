import "dotenv/config";
import express from "express";
import router from "./routes/user-route.js";
const app = express();
const PORT = process.env.PORT || 3001;

app.use("/user", router);
app.listen(PORT, () => console.log(`server started on PORT ${PORT}`));
