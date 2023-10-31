const express = require('express');
const path = require('path');
require('dotenv').config();
const api = require('./api');

const app = express();
const port = process.env.REACT_APP_PORT;

app.use(express.static(path.join(__dirname, "..", "..", "build")));
app.use(express.static("public"));

app.use('/converted', express.static(`${__dirname}/../converted`));
app.use('/api', api);

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "..", "..", "build", "index.html"));
});

app.listen(port, () => {
    console.log(`Running on port ${port}`);
})