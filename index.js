require('dotenv').config();

const express = require('express');
const app = express();

const PORT = process.env.SERVER_PORT || 5060;
const cors = require('cors');
const bodyParser = require('body-parser');
const baseRouter = require('./application/routes');

app.use(cors({
    'allowedHeaders': ['Content-Type'],
    'origin': 'http://localhost:5000',
    'methods': 'GET,POST',
    'preflightContinue': false
}));

app.use(bodyParser.json({ limit: "500mb" }))
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true, parameterLimit: 500000 }))

app.use('/api', baseRouter);

const start = async () => {
    try {
        app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
    } catch (err) {
        console.log(err);
    }
}

start();