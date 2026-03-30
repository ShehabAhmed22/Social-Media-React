import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const token = req.header.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invaled Token " });
    }
  } else {
    res.status(401).json({ message: "token not found " });
  }
};
const verifyTokenAndAuthorization = async (req, res, next) => {
  verifyToken(req, res, async () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "You are not allowed to do that" });
    }
  });
};

const verifyTokenAdmin = async (req, res, next) => {
  verifyToken(req, res, async () => {
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "You are not allowed to do that" });
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAndAuthorization,
  verifyTokenAdmin,
};
