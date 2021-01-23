require('dotenv').config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');

const jwtKey = process.env.JWT_KEY;
const cookieKey = process.env.COOKIE_KEY;

const app = express();

// ************ View engine ************
app.set("view engine", "ejs");
// this line is not necessary if we use a folder namely "views"
// app.set('views', path.join(__dirname, 'views'));

// ************ Middleware ************
app.use(helmet());      //secure http header
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ************ Functions ************
function checkUser(req, res, next) {
    //get token from cookie (web) or header (others, mobile) or req.body
    const token = req.headers['x-access-token'];
    //is there a token
    if (token) {
        //verify token: valid and not expired
        jwt.verify(token, jwtKey, function (err, decoded) {
            if (err) {
                console.log(err);
                res.status(400).send("Invalid token.");
            } else {
                // if everything is good, save decoded payload to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    }
    else {
        res.status(400).send("Token not found.");
    }
}

// ************ Other routes ************
// --- login ---
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username == "admin" && password == "1234") {
        res.send("Login OK");
    }
    else {
        res.status(400).send("Login failed");
    }
});

// --- create JWT ---
app.get("/jwt", (req, res) => {
    const payload = { userID: 1, username: 'admin' };
    const token = jwt.sign(payload, jwtKey, { expiresIn: '1d' });   //60 means expired in 60 seconds or use '10h', '7d'
    res.send(token);
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE2MTEzOTI4OTMsImV4cCI6MTYxMTQ3OTI5M30.4VlKOki1aaqjCeGW6PPsNKZRDhoJvq_dWsXKSEq7Xs4
});

// ************ Page routes ************
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/signIn", (req, res) => {
    res.render("login");
});

// --- show blogs of current year ---
app.get("/blog", checkUser, (req, res) => {
    const years = [2021, 2020, 2019, 2018];
    const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis enim lobortis scelerisque fermentum dui faucibus in ornare quam. Fringilla urna porttitor rhoncus dolor purus non. Dictum at tempor commodo ullamcorper a lacus vestibulum sed arcu.";
    const blogs = [{ title: 'aaa', detail: lorem }, { title: 'bbb', detail: lorem }, { title: 'ccc', detail: lorem }];
    // res.send("Welcome " + req.decoded.username);
    res.render("blog", { username: req.decoded.username, year: years, blog: blogs });
});

// 404
app.use((req, res) => {
    res.status(404).render("404");
});

// ************ Starting server ***************
const port = process.env.PORT;
app.listen(port, function () {
    console.log("Server is ready at " + port);
});