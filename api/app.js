const express = require('express');
const app = express();

const { mongoose } = require('./db/mongoose');

const bodyParser = require('body-parser');

// Load in the mongoose models
const { List, Task, User } = require('./db/models');

// MIDDLEWARE

// Load middleware
app.use(bodyParser.json());

//CORS HEADERS MIDDLEWARE

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
  }
  next();
});

// Verify Refresh Token Middleware (which will be verifying the session)
let verifySession = (req, res, next) => {
  // grab the refresh token from the request header
  let refreshToken = req.header('x-refresh-token');

  // grab the _id from the request header
  let _id = req.header('_id');

  User.findByIdAndToken(_id, refreshToken)
    .then((user) => {
      if (!user) {
        // user couldn't be found
        return Promise.reject({
          error:
            'User not found. Make sure that the refresh token and user id are correct',
        });
      }

      // if the code reaches here - the user was found
      // therefore the refresh token exists in the database - but we still have to check if it has expired or not
      req.user_id = user._id;
      req.userObject = user;
      req.refreshToken = refreshToken;

      let isSessionValid = false;

      user.sessions.forEach((session) => {
        if (session.token === refreshToken) {
          // check if the session has expired
          if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
            // refresh token has not expired
            isSessionValid = true;
          }
        }
      });
      if (isSessionValid) {
        // the session is VALID - call next() to continue with processing this web request
        next();
      } else {
        // the session is not valid
        return Promise.reject({
          error: 'Refresh token has expired or the session is invalid',
        });
      }
    })
    .catch((error) => {
      res.status(401).send(error);
    });
};

// END MIDDLEWARE

// ROUTE HANDLERS

// LIST ROUTES

/*
 * GET /lists
 * Purpose: Get all lists
 */

app.get('/lists', (req, res) => {
  //res.send('Hello World!');
  //   We want to return an array of all the lists in the database
  List.find({ _userId: req.user_id })
    .then((lists) => {
      res.send(lists);
    })
    .catch((err) => {
      res.send(err);
    });
});

/*
 *POST /lists
 * Purpose: Create a list
 */
app.post('/lists', (req, res) => {
  // We want to create a new list and return the new list document back to the user(which includes the id)
  // The list information (fields) will be passed in via the JSON request body
  let title = req.body.title;

  let newList = new List({
    title,
    _userId: req.body._userId,
  });
  newList.save().then((listDoc) => {
    // the full list document is returned
    res.send(listDoc);
  });
});

/*
 * PATCH /lists/:id
 * Purpose: Update a specified list
 */
app.patch('/lists/:id', (req, res) => {
  // We want to update the specified list(list document with id in the URL) with the new values specified in the JSIN body of the request
  List.findOneAndUpdate(
    { _id: req.params.id, _userId: req.user_id },
    { $set: req.body }
  ).then(() => {
    res.send({ message: 'Updated successfully' });
  });
});

/*
 * DELETE /lists/:id
 * Purpose: Delete a list
 */
app.delete('/lists/:id', (req, res) => {
  //We want to delete the specified list (document with id in the URL)
  List.findOneAndDelete({
    _id: req.params.id,
  }).then((removedListDoc) => {
    res.send(removedListDoc);
  });
});

/**
 * GET /lists/:listId/tasks
 * Purpose: Get all tasks in a specific list
 */
app.get('/lists/:listId/tasks', (req, res) => {
  // We want to return all tasks that belong to a specific list (specified bu listId)
  Task.find({
    _listId: req.params.listId,
  }).then((tasks) => {
    res.send(tasks);
  });
});

/**
 * POST /lists/:listId/tasks
 * Purpose: Create a new task in a list specified by listId
 */
app.post('/lists/:listId/tasks', (req, res) => {
  // We want to create a new task in a list specified by listId
  let newTask = new Task({
    title: req.body.title,
    _listId: req.params.listId,
  });
  newTask.save().then((newTaskDoc) => {
    res.send(newTaskDoc);
  });
});

/**
 * PATCH /lists/:listId/tasks/:taskId
 */
app.patch('/lists/:listId/tasks/:taskId', (req, res) => {
  //We want to update an existing task (specified by taskId)
  Task.findOneAndUpdate(
    {
      _id: req.params.taskId,
      _listId: req.params.listId,
    },
    {
      $set: req.body,
    }
  ).then(() => {
    res.send({ message: 'Updated successully!' });
  });
});

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete a task
 */
app.delete('/lists/:listId/tasks/:taskId', (req, res) => {
  Task.findOneAndReplace({
    _id: req.params.taskId,
    _listId: req.params.listId,
  }).then((removedTaskDoc) => {
    res.send(removedTaskDoc);
  });
});

/**
 * USER ROUTES
 */

/**
 * POST /users
 * Purpose: Sign up
 */
app.post('/users', (req, res) => {
  // User sign up

  let body = req.body;
  let newUser = new User(body);

  newUser
    .save()
    .then(() => {
      return newUser.createSession();
    })
    .then((refreshToken) => {
      // Session created successfully - refreshToken returned
      // now we generate an access auth token for the user
      return newUser.generateAccessAuthToken().then((accessToken) => {
        return { accessToken, refreshToken };
      });
    })
    .then((authTokens) => {
      // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
      res
        .header('x-refresh-token', authTokens.refreshToken)
        .header('x-access-token', authTokens.accessToken)
        .send(newUser);
    })
    .catch((error) => {
      res.status(400).send(error);
    });
});

/**
 * POST /users/login
 * Purpose: Login
 */
app.post('/users/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  User.findByCredentials(email, password)
    .then((user) => {
      return user
        .createSession()
        .then((refreshToken) => {
          // Session created successfully - refreshToken returned
          // now we generate an access auth token for the user
          return user.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken };
          });
        })
        .then((authTokens) => {
          // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
          res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(user);
        });
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

/**
 * POST /users/me/access-token
 * Purpose: generates and returns an access token
 */
app.get('/users/me/access-token', verifySession, (req, res) => {
  // we know that the user/caller is authenticated and we have the user_id and user object available to us
  req.userObject
    .generateAccessAuthToken()
    .then((accessToken) => {
      res.header('x-access-token', accessToken).send({ accessToken });
    })
    .catch((error) => {
      res.status(400).send(error);
    });
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
