const checkRole = (roles = []) => {
  return (req, res, next) => {
    try {
      // ❌ No user (token missing/invalid)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      // ❌ Role not allowed
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }

      next();

    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Role check failed"
      });
    }
  };
};

module.exports = checkRole;