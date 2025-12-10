function blockDemoUser(req, res, next) {
  if (req.user && req.user.username === "test") {
    return res.status(403).json({
      error: "Demo hesap ile bu işlem yapılamaz",
      code: "DEMO_USER_BLOCKED"
    });
  }

  next();
}

export default blockDemoUser;
