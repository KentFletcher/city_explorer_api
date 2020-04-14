'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/hello', (request, response) => {
    response.status(200).send('Hello')
});

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

app.listen (PORT, () => {
    console.log('App is running on PORT: ' + PORT);
});
