'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');

//initiates express and an object
const app = express();
const PORT = process.env.PORT || 3001;

//Database Setup
const dbClient = new pg.Client(process.env.DATABASE_URL);


dbClient.on('error', err => console.log(err));

app.use(cors());

app.get('/location', handleLocation);

function handleLocation (request, response) {
  const city = request.query.city;
  const key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;

  //check if the city exists in my database, if the search query matches anything in my search column that i created.  Then return that entire id

  //SELECT search_query from locations
  const sql =`SELECT * FROM locations WHERE search_query=$1;`;
  const safeValues = [city];
  //   console.log('searchValue city', city);

  //if not then run the api call, but before the response, insert into the database so i have it for the next time.
  //INSERT statement: not going to insert an id because it is auto generated.  What we need are the other 4 properties
  //`INSERT INTO(search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4) RETURNING id;`;
  //variable saveValues =[search_query, formatted_query, latitude, longitude]
  //client.query(sql, saveValues).then for superagent

  dbClient.query(sql, safeValues)
    .then(results => {
      if (results.rows[0]){
        response.send(results.rows[0]);
      } else {
        // console.log('else11111111111');
        superagent.get(url)
          .then(results => {
            let geoData = results.body[0];
            let location = new Location(city, geoData);

            response.status(200).send(location);

            const insertSQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);`;
            const searchValues = [city, location.formatted_query, location.latitude, location.longitude];
            dbClient.query(insertSQL, searchValues);

            // for (var i in data) {
            //   if (data[i].display_name.search(city)) {
            //     const display = new Location(city, data[i]);
            //     response.send(display);
            //   }
            // }
          })
          .catch(error => {
            handleError(error, request, response);
          });
      }
    });
}


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



app.get('/movies', (request, response) => {
  const city = request.query.search_query;
  const key = process.env.MOVIE_API_KEY;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${city}`;

  superagent.get(url)
    .then(movieResponse => {
      const data = movieResponse.body.results;
      //   console.log('movie superagent', data);
      response.send(data.map(element => {
        return new Movie(element);
      }));
    }).catch(error => handleError(error, request, response));
});

app.get('/yelp', (request, response) => {
  const city = request.query.city;
  const url = `http://api.yelp.com/v3/businesses/search?location=${city}&term=restaurants`;

  superagent.get(url)
    .set({
      "Authorization": `Bearer ${process.env.YELP_API_KEY}`
    })
    .then(businessResponse => {
      const data = businessResponse.body.businesses;
      //   console.log('movie superagent', data);
      response.send(data.map(element => {
        return new Business(element);
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

//constructor function for Movies
function Movie (movie) {
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.average_votes;
  this.total_votes = movie.total_votes;
  this.image_url = `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`;
  this.popularity = movie.popularity;
  this.released_on = movie.released_on;
}

//constructor function for YELP
function Business (data) {
  this.name = data.name;
  this.image_url = data.image_url;
  this.price = data.price;
  this.rating = data.rating;
  this.url = data.url;
}


//function to handle any errors
function handleError(error, request, response) {
  console.log(error);
  response.status(500).send({status:500, responseText:'Sorry, something went wrong'});
}

app.use('*', (request, response) => response.send('Sorry, that route does not exist.'));

//Starts server listening for requests for database and server
dbClient.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
  });
