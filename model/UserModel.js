// backend/model/UserModel.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: String,
  email: String,
  mobile: Number,
  password: String,
  avatar: String,
}, {
  versionKey: false
});

const UserModel = mongoose.model("users", UserSchema);

module.exports = { UserModel };
