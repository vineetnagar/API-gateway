import users from "../fake-user-data.js";

export default function fakeUser(req, res) {
  try {
    res.status(200).json({
      server: process.env.INSTANCE_NAME || "A",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}
