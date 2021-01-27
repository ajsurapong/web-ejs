// middleware to authen user via cookie and jwt

require('dotenv').config();
const jwt = require("jsonwebtoken");
const jwtKey = process.env.JWT_KEY;

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

module.exports = checkUser;