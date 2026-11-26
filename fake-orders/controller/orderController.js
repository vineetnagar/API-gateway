import orders from "../fake-order-data.js";
export default function getOrder(req, res) {
  try {
    res
      .status(200)
      .json({ server: process.env.INSTANCE_NAME || "A", data: orders });
  } catch (error) {
    res.status(500).json({ message: error });
  }
}
