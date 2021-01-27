require('dotenv').config();
const express = require('express');
const router = require('express').Router();
const bcrypt = require('bcrypt');
const con = require('../config/db');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const jwtKey = process.env.JWT_KEY;
const cookieKey = process.env.COOKIE_KEY;

router.use(cookieParser(cookieKey));   //to read/write cookies
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// --- password encrytion ---
router.get("/password/:pass", function (req, res) {
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
router.post("/login", (req, res) => {
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
router.get("/jwt", (req, res) => {
    const payload = { userID: 1, username: 'admin' };
    const token = jwt.sign(payload, jwtKey, { expiresIn: '1d' });   //60 means expired in 60 seconds or use '10h', '7d'
    res.send(token);
});

// --- logout ---
router.get("/logout", (req, res) => {
    // remove token cookie
    res.clearCookie("mytoken");
    // return to homepage
    // note that user can return to previous kept page in cache, but it is just old snapshot
    res.redirect("/");
});

module.exports = router;