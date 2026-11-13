module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido." });
  return res.status(200).json({
    environment: process.env.VERCEL_ENV || "local",
    isPreview: process.env.VERCEL_ENV !== "production"
  });
};
