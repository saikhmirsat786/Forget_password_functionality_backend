const mongoose = require("mongoose");

const connections = mongoose.connect(
  "mongodb+srv://saikhmirsat:saikhmirsat@cluster0.56eq4k2.mongodb.net/forgetpasswordtest?retryWrites=true&w=majority"
);

module.exports = {
  connections,
};
