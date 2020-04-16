'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

//initiates express and an object
const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/hello', (request, response) => {
  response.status(200).send('Hello');
});

app.get('/location', (request, response) => {
  const city = request.query.city;
  const key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;

  superagent.get(url)
    .then(locationResponse => {
      const data = locationResponse.body;
      for (var i in data) {
        if (data[i].display_name.search(city)) {
          const display = new Location(city, data[i]);
          response.send(display);
        }
      }
    })
    .catch(error => {
      handleError(error, request, response);
    });
});


app.get('/weather', (request, response) => {
  const { latitude, longitude } = request.query;
  const key = process.env.WEATHER_API_KEY;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${key}`;

  superagent.get(url)
    .then(weatherResponse => {
      const data = weatherResponse.body.data;
      const result = [];
      data.forEach(item => {
        result.push(new Weather(item.datetime, item.weather.description));
      });
      //   console.log(result);
      response.send(result);
    })
    .catch(error => handleError(error, request, response));
});

app.get('/trails', (request, response) => {
  const {latitude, longitude} = request.query;
  const key = process.env.TRAIL_API_KEY;
  const url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&key=${key}`;

  superagent.get(url)
    .then(trailResponse => {
      const data = trailResponse.body.trails;
      response.send(data.map(element => {
        return new Trails(element);
      }));
    }).catch(error => handleError(error, request, response));
});


//constructor function for Location
function Location (city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
}

//constructor function for Weather
function Weather(date, forecast){
  this.forecast = forecast;
  this.time = new Date(date).toDateString();
}

//constructor function for Hiking Trails
function Trails (trail) {
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.conditions = trail.conditions;
  this.condition_date = trail.conditionDate;
  this.condition_time = trail.conditionTime;
}



function handleError(error, request, response, next) {
  console.log(error);
  response.status(500).send({status:500, responseText:'Sorry, something went wrong'});
}

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

//Starts server listening for requests
app.listen (PORT, () => {
  console.log('App is running on PORT: ' + PORT);
});
