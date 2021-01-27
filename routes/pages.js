require('dotenv').config();

const router = require('express').Router();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const jwtKey = process.env.JWT_KEY;
const cookieKey = process.env.COOKIE_KEY;

router.use(cookieParser(cookieKey));   //to read/write cookies

// root
router.get("/", (req, res) => {
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

router.get("/signIn", (req, res) => {
    res.render("login");
});

module.exports = router;