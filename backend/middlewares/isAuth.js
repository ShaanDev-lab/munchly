import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "token not found" });
    }

    let decodeToken;
    try {
      decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "invalid or expired token" });
    }
    if (!decodeToken?.userId) {
      return res.status(401).json({ message: "invalid token payload" });
    }
    req.userId = decodeToken.userId;
    next();
  } catch (error) {
    return res.status(500).json({ message: "authentication error" });
  }
};

export default isAuth;
