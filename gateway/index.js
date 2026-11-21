import "dotenv/config";
import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ message: "gateway is alive" });
});
app.listen(PORT, () => console.log(`server started on PORT ${PORT}`));
