const express = require("express");
const path = require("path");

const app = express();

// ************ View engine ************
app.set("view engine", "ejs");
// this line is not necessary if we use a folder namely "views"
// app.set('views', path.join(__dirname, 'views'));

// ************ Middleware ************
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ************ Other routes ************
app.post("/login", (req, res) => {
    const {username, password} = req.body;
    if(username == "admin" && password == "1234") {
        res.send("Login OK");
    }
    else {
        res.status(400).send("Login failed");
    }
});

// ************ Page routes ************
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/signIn", (req, res) => {
    res.render("login");
});

// --- show blogs of current year ---
app.get("/blog", (req, res) => {
    const years = [2021, 2020, 2019, 2018];
    const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis enim lobortis scelerisque fermentum dui faucibus in ornare quam. Fringilla urna porttitor rhoncus dolor purus non. Dictum at tempor commodo ullamcorper a lacus vestibulum sed arcu.";
    const blogs = [{title: 'aaa', detail: lorem}, {title: 'bbb', detail: lorem}, {title: 'ccc', detail: lorem}];
    res.render("blog", {year: years, blog: blogs});
});

// 404
app.use((req, res) => {
    res.status(404).render("404");
});

// ************ Starting server ***************
const port = 3000;
app.listen(port, function () {
    console.log("Server is ready at " + port);
});