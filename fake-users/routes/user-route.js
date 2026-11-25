import express from "express";
import fakeUser from "../controller/user-controller.js";

const router = express.Router();

router.get("/getUsers", fakeUser);

export default router;
