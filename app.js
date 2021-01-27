require('dotenv').config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

//----------- for MySQL --------------------
const mysql = require('mysql');
const config = {
    host    : process.env.DB_HOST,
    user    : process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE    
};
const con = mysql.createConnection(config);
//------------------------------------------

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
app.use(cookieParser(cookieKey));   //to read/write cookies

// ************ Functions ************
function checkUser(req, res, next) {
    //get token from cookie (web) or header (others, mobile) or req.body
    // token should not be kept in web session/local storage, must be signed cookie
    // for mobile, token could be kept in local storage 
    const token = req.signedCookies["mytoken"] || req.headers['x-access-token'];
    //is there a token?
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
        // res.status(400).send("Token not found.");
        res.redirect("/");
    }
}

// ************ Other routes ************
// --- password encrytion ---
app.get("/password/:pass", function (req, res) {
    const password = req.params.pass;
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, function(err, hash) {
        if(err) {
            return console.log(err);
        }
        //return hashed password, 60 characters
        res.send(hash);
    });
});

// --- login ---
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT userID, password FROM user WHERE username=?";
    con.query(sql, [username], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(400).send("Database server error");
        }
        if(result.length != 1) {
            return res.status(400).send("Wrong username"); 
        }
        bcrypt.compare(password, result[0].password, (err, same) => {
            if (err) {
                return res.status(500).send("Authentication Server error");
            }
            if (same) {
                //correct login, create JWT and save to client cookie
                const payload = { userID: result[0].userID, username: username };
                const token = jwt.sign(payload, jwtKey, { expiresIn: '1d' });   //60 means expired in 60 seconds or use '10h', '7d'

                // save JWT to cookie at client
                const cookieOption = {
                    maxAge: 24 * 60 * 60 * 1000,  //milliseconds
                    httpOnly: true,
                    signed: true
                };
                res.cookie("mytoken", token, cookieOption);
                return res.send("/blog");
            }
            //wrong password
            res.status(400).send("Wrong password");
        });
    });
});

// --- create JWT ---
app.get("/jwt", (req, res) => {
    const payload = { userID: 1, username: 'admin' };
    const token = jwt.sign(payload, jwtKey, { expiresIn: '1d' });   //60 means expired in 60 seconds or use '10h', '7d'
    res.send(token);
});

// --- logout ---
app.get("/logout", (req, res) => {
    // remove token cookie
    res.clearCookie("mytoken");
    // return to homepage
    // note that user can return to previous kept page in cache, but it is just old snapshot
    res.redirect("/");
});

// ========== Blog CRUD =========
// --- show all blogs ---
app.get("/blog", checkUser, (req, res) => {
    // get all years
    let sql = "SELECT DISTINCT year FROM post ORDER BY year DESC";
    con.query(sql, (err, years) => {
        if(err) {
            console.log(err);
            return res.status(500).send("Database server error");
        }
        // get all blog posts ordered by year
        sql = "SELECT postID, title, detail, year FROM post WHERE userID=? ORDER BY year DESC";
        con.query(sql, [req.decoded.userID], (err, blogs) => {
            if(err) {
                console.log(err);
                return res.status(500).send("Database server error");
            }
            res.render("blog", { username: req.decoded.username, year: years, blog: blogs });
        });
    });
});

// --- show blogs of current year ---
app.get("/blog/:year", checkUser, (req, res) => {
    const year = req.params.year;
    // get all years
    let sql = "SELECT DISTINCT year FROM post ORDER BY year DESC";
    con.query(sql, (err, years) => {
        if(err) {
            console.log(err);
            return res.status(500).send("Database server error");
        }
        // get all blog posts ordered by year
        sql = "SELECT postID, title, detail, year FROM post WHERE userID=? AND year=?";
        con.query(sql, [req.decoded.userID, year], (err, blogs) => {
            if(err) {
                console.log(err);
                return res.status(500).send("Database server error");
            }
            res.render("blog", { username: req.decoded.username, year: years, blog: blogs, chosenYear: year });
        });
    });
});

// --- Delete blog post ---
app.delete("/blog/post/:id", checkUser, (req, res) => {
    const postID = req.params.id;
    const sql = "DELETE FROM post WHERE postID=? AND userID=?";
    con.query(sql, [postID, req.decoded.userID], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).send("Database server error");
        }
        if(result.affectedRows != 1) {
            return res.status(500).send("Delete failed");
        }
        res.send("/blog");
    });
});

// --- Add blog post ---
app.post("/blog/post", checkUser, (req, res) => {
    const {title, detail} = req.body;
    const year = new Date().getFullYear();
    const sql = "INSERT INTO post(userID, title, detail, year) VALUES(?,?,?,?)";
    con.query(sql, [req.decoded.userID, title, detail, year], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).send("Database server error");
        }
        if(result.affectedRows != 1) {
            return res.status(500).send("Adding failed");
        }
        res.send("/blog");
    });
});

// --- Edit blog post ---
app.put("/blog/post", checkUser, (req, res) => {
    const {postID, title, detail} = req.body;
    const sql = "UPDATE post SET title=?, detail=? WHERE postID=? AND userID=?";
    con.query(sql, [title, detail, postID, req.decoded.userID], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).send("Database server error");
        }
        if(result.affectedRows != 1) {
            return res.status(500).send("Updating failed");
        }
        res.send("/blog");
    });
});

// ************ Page routes ************
app.get("/", (req, res) => {
    const token = req.signedCookies["mytoken"] || req.headers['x-access-token'];
    //is there a token?
    if (token) {
        //verify token: valid and not expired
        jwt.verify(token, jwtKey, function (err, decoded) {
            if (err) {
                // token found but not valid
                res.render("index");
            } else {
                res.render("index", {user: decoded});
            }
        });
    }
    else {
        //no token
        res.render("index");
    }
});

app.get("/signIn", (req, res) => {
    res.render("login");
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