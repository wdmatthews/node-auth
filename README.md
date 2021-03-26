# node-auth
A simple authentication system for Node.js, including middleware for preventing page access.
## Installation
All you need is to require the node-auth.js file:
```
const { register, login, logout, requireAuth, requireNoAuth } = require('./node-auth')(
  MongoClient, bcrypt, authKey, mongoURL, databaseName, usersCollection
);
```
MongoClient is the MongoClient class from `const { MongoClient } = require('mongodb');`
bcrypt is from `const bcrypt = require('bcrypt');`
mongoURL is the URL used to connect to MongoDB.
databaseName is the name of the database used to store user accounts.
usersCollection is the name of the collection used to store user accounts.
## Security
The register and login functions take a username and password, but do not sanitize it.
Make sure to properly sanitize the username and password before calling these functions.
Additionally, bcrypt is used with 10 salt rounds.
## Use
### register
The register method checks if a user account already exists.
If not, it creates a new account with the given username and password.
The password is hashed using bcrypt's default algorithm and 10 rounds of salt.
You can call the register method in an async method like this:
```
// Stores the result of calling register.
// True if registration succeeded, false otherwise.
const registerResult = await register(username, password);
```
### login
The login method checks if a username and password match a user's account.
You can call the login method in an async method like this:
```
// Stores the result of calling login.
// True if the username and password match, false otherwise.
const loginResult = await login(username, password);
```
### logout
The logout middleware destroys the current session.
```
app.get('/logout', logout, (req, res) => res.redirect('/'));
```
### requireAuth
The requireAuth function returns a middleware that redirects the user if they **are not** authenticated.
It requires a failureURL to redirect to if the user **is not** authenticated.
```
app.get('/dashboard', requireAuth('/'), (req, res) => {
  res.sendFile(__dirname + '/views/dashboard.html');
});
```
### requireNoAuth
The requireNoAuth function returns a middleware that redirects the user if they **are** authenticated.
It requires a failureURL to redirect to if the user **is** authenticated.
```
app.get('/', requireNoAuth('/dashboard'), (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});
```