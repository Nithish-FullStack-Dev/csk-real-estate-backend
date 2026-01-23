import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    
        if (!token) {
          return res.status(401).json({ error: "Unauthorized" });
        }
    
        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
       
        if (!payload) {
          return res.status(401).json({ error: "Invalid token" });
        }
        
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
