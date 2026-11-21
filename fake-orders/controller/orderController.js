import orders from "../fake-order-data.js";
export default function getOrder(req, res) {
  try {
    res.status(200).json({ data: orders });
  } catch (error) {
    res.status(500).json({ message: error });
  }
}
