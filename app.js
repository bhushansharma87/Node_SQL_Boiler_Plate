const dotenv = require("dotenv").config({
  path: `config/.env.${process.env.NODE_ENV}`,
});
const express = require("express");
const passportConfig = require("./middleware/passportConfig");
const cors = require("cors");
//Environment initialization
const { globalResponse } = require("./utils/others");
const ErrorMiddleware = require("./middleware/Error");
const allRoutes = require("./routes/index");
const { morgan, customFormat } = require("./utils/morganSettings");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();
app.use(express.json());

/****************morgan Middleware********************************/
app.use(morgan(customFormat));
app.use(globalResponse);

/*****************CORS*******************/
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*************************************Swagger documentation****************************************/
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

/*************************************Routes****************************************/
app.use("/api/v1", allRoutes);

//Passport initialzation
app.use(passportConfig.initialize());

app.use(express.static(__dirname));
app.get("/", (req, res) => {
  console.log("serving");
  res.send("running.....");
});

module.exports = app;

app.use("*", (req, res) => {
  res.send("Route not found");
});
app.use(ErrorMiddleware);
