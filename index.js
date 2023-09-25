require("dotenv").config();
require("express-async-errors");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConnection");
const getRoutes = require("./routes");
const corsOptions = require("./config/corsOptions");
const handlebars = require("express-handlebars");

const app = express();
const PORT = process.env.PORT || 3500;

connectDB();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use("/api", getRoutes());

//Sets our app to use the handlebars engine
app.set("view engine", "handlebars");
//Sets handlebars configurations (we will go through them later on)
app.engine(
  "handlebars",
  handlebars({
    layoutsDir: __dirname + "/views",
  })
);

app.all("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not available" });
});

mongoose.connection.once("open", () => {
  app.listen(PORT, () =>
    console.log(`⚡️[server]: Server is running on port: ${PORT}`)
  );
});
mongoose.connection.on("error", (err) => console.error(err));
