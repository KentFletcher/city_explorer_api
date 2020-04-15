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
  response.status(200).json(display);
});

app.get('/weather', (request, response) => {
  const weather = require('./data/darksky.json');
  const weatherArray = weather.daily.data;
//   const display = weather(city, weatherData);
//   response.status(200).json(display);

  const finalWeatherArray = weatherArray.map(day => {
      return new Weather(day);
  })
  response.send(finalWeatherArray);
});


//constructor function for location
function Location (city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
}

//constructor function for weather data
// function weather (city, weatherData) {
// //     this.forecast = weatherData.daily.data[0].summary;
// //     this.time = weatherData.daily.data[0]time;
//   const weatherArr = [];
//   let data = weatherData.daily.data;

//   data.forEach (day => {
//     const newObj = {};

//     newObj.forecast = day.summary;
//     newObj.time = new Date(day.time).toDateString();

//     weatherArr.push(newObj);
//   });
//   return weatherArr;
// }

function Weather(obj){
    this.forecast = obj.summary;
    this.time = new Date(obj.time * 1000).toDateString();
}

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));



app.listen (PORT, () => {
  console.log('App is running on PORT: ' + PORT);
});
