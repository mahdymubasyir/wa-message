const API_KEY = process.env.API_KEY;

export function authenticate(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "API KEY wajib diisi",
    });
  }

  if (apiKey !== API_KEY) {
    return res.status(403).json({
      success: false,
      message: "Invalid API credentials",
    });
  }

  next();
}
