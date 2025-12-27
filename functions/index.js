const functions = require("firebase-functions");
const express = require("express");

const app = express();

app.get("/hello", (req, res) => {
  res.json({message: "Hello from Firebase Functions"});
});

exports.api = functions.https.onRequest(app);
