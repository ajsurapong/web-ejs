const express = require('express');
const router = require('express').Router();
const con = require('../config/db');
const checkUser = require('./checkUser');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
// middleware to authen user via cookie and jwt
router.use(checkUser);

// --- show all blogs ---
router.get("/blog", (req, res) => {
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
router.get("/blog/:year", (req, res) => {
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
router.delete("/blog/post/:id", (req, res) => {
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
router.post("/blog/post", (req, res) => {
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
router.put("/blog/post", (req, res) => {
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

module.exports = router;