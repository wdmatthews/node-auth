const express = require('express');
const app = express();
const http = require('http').createServer(app);
const session = require('express-session');
const { MongoClient } = require('mongodb');
const MongoStore = require('connect-mongo');
require('dotenv').config();
const bcrypt = require('bcrypt');

app.disable('x-powered-by');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoURL = `mongodb://localhost:27017/${process.env.DB_NAME}`;
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: MongoStore.create({ mongoUrl: mongoURL }),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: 'auto' },
}));
// Configure node-auth to work properly.
const { register, login, logout, requireAuth, requireNoAuth } = require('./node-auth')(
  MongoClient, bcrypt, 'user', mongoURL, 'node_auth', 'users'
);

// Require the user to not be authenticated to view the home page.
app.get('/', requireNoAuth('/dashboard'), (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Require the user to be authenticated to view the dashboard.
app.get('/dashboard', requireAuth('/'), (req, res) => {
  res.sendFile(__dirname + '/views/dashboard.html');
});

app.post('/register', requireNoAuth('/dashboard'), async (req, res) => {
  // Make sure to sanitize the username and password.
  const registerResult = await register(req.body.username, req.body.password);
  // If the registration succeeded, then login the user.
  if (registerResult) {
    req.session.user = { username: req.body.username };
    res.redirect('/dashboard');
  }
  res.redirect('/');
});

app.post('/login', requireNoAuth('/dashboard'), async (req, res) => {
  // Make sure to sanitize the username and password.
  const loginResult = await login(req.body.username, req.body.password);
  // If the login succeeded, then store the user's data in the session.
  if (loginResult) {
    req.session.user = { username: req.body.username };
    res.redirect('/dashboard');
  }
  else {
    res.redirect('/');
  }
});

// Use the logout middleware to logout and then redirect to the home page.
app.get('/logout', requireAuth('/'), logout, (req, res) => res.redirect('/'));

// Send an error 404 message for all other GET and POST routes.
app.get('*', (req, res) => res.send('Error 404'));
app.post('*', (req, res) => res.send('Error 404'));

http.listen(3000, () => console.log(`App listening at http://localhost:3000`));