import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import multer from "multer";
// const path = require("path");
// // const express = require("express");
const app = express();
// const multer = require("multer");

app.use(cors());
// app.use(express.json());
// app.use(express.static("public"));
// const storage = multer.diskStorage({
//   destination: "./public/img/",
//   filename: function (req, file, cb) {
//     cb(null, "imgfile" + Date.now() + path.extname(file.originalname));
//   },
// });

// const port = 4001;
// const pool = mysql.createPool({
//   host: "localhost",
//   user: "sbsst",
//   password: "sbs123414",
//   database: "a9",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 1000000 },
// });

// app.post("/upload", upload.single("img"), function (req, res, next) {
//   res.send({
//     fileName: req.file.filename,
//   });
// });

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });

app.use(express.json());
const port = 3001;
const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "a9",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
app.use(express.static("public"));
const storage = multer.diskStorage({
  destination: "./public/img/",
  filename: function (req, file, cb) {
    cb(null, "imgfile" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
});

app.post("/upload", upload.single("img"), function (req, res, next) {
  res.send({
    fileName: req.file.filename,
  });
});

app.get("/uploadTest", async (req, res) => {
  console.log("success");
  return;
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
