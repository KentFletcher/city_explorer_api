'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/hello', (request, response) => {
  response.status(200).send('Hello');
});

app.get('/location', (request, response) => {
  const geoData = require('./data/geo.json');
  const city = request.query.city;

  const display = new Location(city, geoData[0]);

  //new var equal to the instance, pass this query to our constructor function, new Constructor (city and geoData)
  response.status(200).json(display);
});

function Location (city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
}


app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

app.listen (PORT, () => {
  console.log('App is running on PORT: ' + PORT);
});
