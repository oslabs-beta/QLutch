const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb+srv://reneetoscan:codesmith@cluster0.4vmzxwp.mongodb.net/";

mongoose
  .connect(MONGO_URI, {
    // options for the connect method to parse the URI
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // sets the name of the DB that our collections are part of
    dbName: "qlutch_test",
  })
  .then(() => console.log("Connected to Mongo DB."))
  .catch((err) => console.log(err));

const Schema = mongoose.Schema;

const personSchema = new Schema({
  id: Number,
  name: { type: String, required: true },
  height: Number,
  hair_color: String,
  films: Array
});

const Person = mongoose.model("person", personSchema);

const filmSchema = new Schema({
  title: String,
});

const Film = mongoose.model("film", filmSchema);

module.exports = {
  Person,
  Film,
};
