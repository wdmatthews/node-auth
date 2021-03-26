/**
 * 
 * @param {MongoClient} MongoClient The MongoClient class from mongodb.
 * @param {object} bcrypt The object return from importing bcrypt.
 * @param {string} authKey The key of the session object that when present signifies the user as authenticated.
 * @param {string} mongoURL The URL to connect to MongoDB.
 * @param {string} databaseName The name of the database to store user data in.
 * @param {string} usersCollection The name of the collection to store user data in.
 * @returns {object}
 */
module.exports = function(MongoClient, bcrypt, authKey, mongoURL, databaseName, usersCollection) {
  return {
    /**
     * Attempts to create a new user document with a username and password.
     * SECURITY WARNING: Make sure to sanitize the username and password before invoking this function.
     * @param {string} username The username for the new user.
     * @param {string} password The password for the new user.
     * @returns Whether or not registration succeeded.
     * @example const registerResult = await register(username, password);
     */
    async register(username, password) {
      let client = null;
      let success = false;
      try {
        client = await MongoClient.connect(mongoURL, { useUnifiedTopology: true });
        const users = client
          .db(databaseName)
          .collection(usersCollection);
        const user = await users.findOne({ username });
        if (!user) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await users.insertOne({ username, password: hashedPassword });
          success = true;
        }
      } finally {
        await client.close();
      }
      return success;
    },
    /**
     * Checks if the given username and password match in the database.
     * SECURITY WARNING: Make sure to sanitize the username and password before invoking this function.
     * @param {string} username The username for the user.
     * @param {string} password The password for the user.
     * @returns Whether or not login succeeded.
     * @example const loginResult = await login(username, password);
     */
    async login(username, password) {
      let client = null;
      let success = false;
      try {
        client = await MongoClient.connect(mongoURL, { useUnifiedTopology: true });
        const users = client
          .db(databaseName)
          .collection(usersCollection);
        const user = await users.findOne({ username });
        if (user) {
          const passwordMatches = await bcrypt.compare(password, user.password);
          success = passwordMatches;
        }
      } finally {
        await client.close();
      }
      return success;
    },
    /**
     * Middleware that destroys the current session.
     * @param {object} req The Request object from Express.js.
     * @param {object} res The Result object from Express.js.
     * @param {function} next The next function to call.
     * @example app.get('/logout', logout, (req, res) => res.redirect('/'));
     */
    logout(req, res, next) {
      if (req.session) req.session.destroy(next);
      else next();
    },
    /**
     * Returns middleware that requires users to be authenticated before continuing.
     * @param {string} failureURL The URL to redirect to if the user is not authenticated.
     * @returns {function} The middleware to use for Express.js.
     * @example app.get('/dashboard', requireAuth('/'), (req, res) => res.sendFile(__dirname + '/views/dashboard.html'));
     */
    requireAuth(failureURL) {
      return (req, res, next) => {
        if (!req.session[authKey]) res.redirect(failureURL);
        else next();
      };
    },
    /**
     * Returns middleware that requires users to not be authenticated before continuing.
     * @param {string} failureURL The URL to redirect to if the user is authenticated.
     * @returns {function} The middleware to use for Express.js.
     * @example app.get('/', requireNoAuth('/dashboard'), (req, res) => res.sendFile(__dirname + '/views/index.html'));
     */
    requireNoAuth(failureURL) {
      return (req, res, next) => {
        if (req.session[authKey]) res.redirect(failureURL);
        else next();
      };
    },
  };
};