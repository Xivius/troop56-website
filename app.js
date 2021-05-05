'use strict';
const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const {google} = require('googleapis');
const storage = require('node-persist');
const open = require('open');
const path = require('path');
const rateLimit = require("express-rate-limit");
const sf = require('serve-favicon');
const url = require('url');
const config = require('./config.js');

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Use the EJS template engine
app.set("view engine", "ejs");
// Enable the necessary middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(sf(path.join(__dirname, "favicon.ico")));
app.use(express.static(path.join(__dirname, "public")));
app.use(limiter);

// Create App Cache for performance enhancements
const mediaItemCache = storage.create({
  dir: 'mediaItem-cache/',
  ttl: 3000000 + Math.floor(Math.random() * 1000),  // ~50 minutes
});
mediaItemCache.init();
const albumCache = storage.create({
  dir: 'album-cache/',
  ttl: 1800000 + Math.floor(Math.random() * 1000),  // ~30 minutes
});
albumCache.init();
const tokenCache = storage.create({
  dir: 'token-cache/',
  ttl: 3600000,  // 60 minutes
});
tokenCache.init();

//const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")));
let accessToken, refreshToken, credentials, oauth2Client;
tokenCache.getItem('tokens').then((token) => {
  credentials = config.web;

  oauth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );
  oauth2Client.on('tokens', (tokens) => {
    tokenCache.setItem('tokens', tokens);
    accessToken = tokens.access_token;
  });
  // If it has been awhile, make the user sign in.
  if (token === undefined) {
    var auth_url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      response_type: 'code',
      scope: config.scope,
    });
    if (process.platform === 'linux') {
      console.log(auth_url); // deployment server has no GUI
    } else {
      open(auth_url, {wait: false}).then(cp => cp.unref());
    }
  } else {
    accessToken = token.access_token;
    refreshToken = token.refresh_token;
    oauth2Client.setCredentials(token);
  }
});

// Render Webpages
app.get('/', async (req, res) => {
  var homePageID = "AKfiElaDaOYkji22_btQpsdV2B-vbB8-vGqrmUptnpOdQVr4NNdj6Ys";
  var data = await albumContents(homePageID);
  if (!data) {
    await refreshAccessToken();
    data = await albumContents(homePageID);
  }
  res.render('pages/index', {
    title: 'Troop 56 - Burr Ridge, IL',
    page: '',
    photos: data
  });
});
app.get('/activities', (req, res) => {
  res.render('pages/activities', {
    title: 'Activities - Troop 56',
    page: 'activities'
  });
});
app.get('/photos', async (req, res) => {
  var data = await googleAlbums();
  if (!data) {
    await refreshAccessToken();
    data = await googleAlbums();
  }
  res.render('pages/photos', {
    title: 'Photos - Troop 56',
    page: 'photos',
    albums: data
  });
});
app.get('/album-photos', async (req, res, next) => {
  var urlData = new URL(req.url, 'http://localhost:8080').searchParams;
  if (urlData.has('albumId') && urlData.has('albumTitle')) {
    var data = await albumContents(urlData.get('albumId'));
    if (!data) {
      await refreshAccessToken();
      data = await albumContents(urlData.get('albumId'));
    }
    res.render('pages/album-photos', {
      title: 'Photos - '+urlData.get('albumTitle'),
      page: 'album-photos',
      photos: data
    });
  } else {
    res.redirect("/404");
  }
});
app.get('/contact-us', (req, res) => {
  res.render('pages/contact-us', {
    title: 'Contact Us - Troop 56',
    page: 'contact-us'
  });
});

// Callback method for Google authenication
app.get('/auth/google/callback', async (req, res) => {
  const qs = new URL(req.url, 'http://localhost:' + config.port).searchParams;
  oauth2Client.getToken(qs.get('code')).then((response) => {
    if (response.tokens) {
      accessToken = response.tokens.access_token;
      refreshToken = response.tokens.refresh_token;
      oauth2Client.setCredentials(response.tokens);
      res.redirect('/');
    } else {
      res.status(403).send({"403": "Forbidden"});
    }
  }).catch((err) => {
    res.status(403).send({"403": "Forbidden"});
  });

});

// Access all albums
async function googleAlbums() {
  const cachedAlbums = await albumCache.getItem('albumList');
  if (cachedAlbums) {
    return cachedAlbums;
  } else {
    return axios.get(config.base_uri + '/v1/albums', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      json: true,
    }).then((response) => {
      var res = response.data;
      albumCache.setItem('albumList', res);
      return res;
    }).catch((error) => {
      console.log(error.response.data);
    });
  }
}

// Access all photos of a specific album
async function albumContents(albumId) {
  const cachedMediaItem = await mediaItemCache.getItem(albumId);
  if (cachedMediaItem) {
    return cachedMediaItem;
  } else {
    return axios.post(config.base_uri + '/v1/mediaItems:search', {
      "pageSize": "100",
      "albumId": albumId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      json: true,
    }).then(function (response) {
      mediaItemCache.setItem(albumId, response.data);
      return response.data;
    }).catch(function (error) {
      console.log(error.response.data);
    });
  }
}

// Request new access token if old one expired
function refreshAccessToken() {
  return axios.post(credentials.token_uri, {
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  }).then((response) => {
    var res = response.data;
    accessToken = res.access_token;
    var storeData = {
      "access_token": accessToken,
      "refresh_token": refreshToken,
      "scope": res.scope,
      "token_type": res.token_type,
      "expiry_date": res.expiry_date
    };
    tokenCache.setItem("tokens", storeData);
    oauth2Client.setCredentials(storeData);
    return res.data;
  }).catch((err) => {
    console.log(err.response.data);
  });
}

// Handle Errors
app.get('/403', function(req, res, next) {
  res.status(403);
  next(new Error('403: Forbidden'));
});
app.get('/404', function(req, res, next) {
  next();
});
app.get('/500', function(req, res, next) {
  res.status(500);
  next(new Error('500: Internal Server Error'));
});
app.use(function(req, res, next) {
  res.status(404);
  res.render('pages/404', {
    title: '404: Page Not Found',
    page: '404'
  });
});

app.listen(process.env.PORT || config.port);
