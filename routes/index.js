const express = require("express");
const authRouter = require("./authRoutes");
const profileRouter = require("./profileRoutes");

const allRoutes = express.Router();
const defaultRoutes = [
  {
    path: "/auth",
    route: authRouter,
  },
  {
    path: "/profile",
    route: profileRouter,
  },
];

defaultRoutes.forEach((route) => {
  allRoutes.use(route.path, route.route);
});

module.exports = allRoutes;
