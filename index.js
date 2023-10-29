require("dotenv").config();
require("express-async-errors");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConnection");
const getRoutes = require("./routes");
const corsOptions = require("./config/corsOptions");
const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3500;

connectDB();

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan("common"));
app.use("/api/v1", getRoutes());

app.all("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not available" });
});

mongoose.connection.once("open", () => {
  app.listen(PORT, () =>
    console.log(`⚡️[server]: Server is running on port: ${PORT}`)
  );
});
mongoose.connection.on("error", (err) => console.error(err));
