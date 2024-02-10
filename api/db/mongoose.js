// This file will handle connection logic to the mongoDB database
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose
  .connect('mongodb://localhost:27017/TaskManager', {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB successfully!');
  })
  .catch((e) => {
    console.log('Error with attempting to connect to MongoDB!');
    console.log(e);
  });

module.exports = {
  mongoose,
};
