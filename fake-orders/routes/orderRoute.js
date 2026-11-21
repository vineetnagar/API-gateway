import express from "express";
import getOrder from "../controller/orderController.js";

const router = express.Router();

router.get("/getOrders", getOrder);

export default router;
