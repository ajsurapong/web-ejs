const express = require("express");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");

const pageRoute = require("./routes/pages");
const otherRoute = require("./routes/others");
const blogRoute = require("./routes/blogs");

const app = express();

// ************ View engine ************
app.set("view engine", "ejs");
// this line is not necessary if we use a folder namely "views"
// app.set('views', path.join(__dirname, 'views'));

// ************ Middleware ************
app.use(compression()); //compress server response
app.use(helmet());      //secure http header
app.use(express.static(path.join(__dirname, "public")));

// ************ Page routes ************
// This routes must be on top of other routes
app.use(pageRoute);

// ************ Other routes ************
app.use(otherRoute);

// ************ Blog routes ************
app.use(blogRoute);

// 404
app.use((req, res) => {
    res.status(404).render("404");
});

// ************ Starting server ***************
const port = process.env.PORT;
app.listen(port, function () {
    console.log("Server is ready at " + port);
});