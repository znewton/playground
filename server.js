const express = require("express");
const opn = require("opn");
const path = require("path");
const port = process.env.PORT || 3030;
const app = express();

app.use(express.static(__dirname + "/"));

const server = app.listen(port);

console.log("Server listening on port " + port);

opn(`http://localhost:${port}`);
