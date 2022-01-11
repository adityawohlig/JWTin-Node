require('dotenv').config();
// now only for login, logout and refresh tokens

// npm run dev :- nodemon
console.log("Development Server: http://localhost:4000");
// ref : https://www.youtube.com/watch?v=mbsmsi7l3r4

const express = require("express");
const { use } = require('express/lib/router');
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

// const posts = [
//     {
//         username: "Aditya",
//         title: "Post 1"

//     },
//     {
//         username: "Aji",
//         title: "Post 2"
//     },
//     {
//         username: "Nani",
//         title: "Post 3"
//     },
//     {
//         username: "Nana",
//         title: "Post 14"
//     },
//     {
//         username: "Nani",
//         title: "Post 13"
//     },
//     {
//         username: "Nani",
//         title: "Post 23"
//     },
//     {
//         username: "Nani",
//         title: "Post 7"
//     },
//     {
//         username: "Nani",
//         title: "Post 27"
//     },
//     {
//         username: "Aditya",
//         title: "Post 4"

//     },
//     {
//         username: "Aditya",
//         title: "Post 7"

//     },  
// ]

// authenticateToken is a middleware which will be used first

// app.get("/posts", authenticateToken, (req, res) => {
//     // user is an object
//     res.json(posts.filter( post => post.username === req.user.name));
// } );


// remember to put application/json in POSTMAN instead of text

// normally you will store refresh tokens in db or redis cache

let refreshTokens = [];


app.post('/login', (req,res) => {
    // Authenticate User
    
    const username = req.body.username;
    // sign takes user object
    const user = { name : username };
    
    // secret key can be generated using crypto library in node.
    // require('crypto').randomBytes(64).toString('hex') do in REPL
    // for now AdityaBapat777 taken secret key
    const accessToken = generateAccessToken(user);

    // as accessToken will expire we will need refresh token
    const refreshToken = jwt.sign(user,process.env.REFRESH_TOKEN_SECRET);
    // we are going to manually handle the expiration of the refresh token

    // push in array, not ideal soln
    refreshTokens.push(refreshToken);

    // pass both tokens
    res.json({ accessToken: accessToken, refreshToken : refreshToken });
})


// after running post request in postman we get access token
//  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NDE4MzY0MTl9.kDo2ZHmQjYYwDm8pHkq3F3oDpoQ5MYRAl7Rughq3bHQ"
// this access token obtained on username Aditya

// writing middleware that will authenticate our web token:


function authenticateToken(req, res, next){
    
    // above access token will be in header
    const authHeader = req.headers['authorization'];
    
    // format will be Bearer <Token Value>, you will do in Authentication header
    // we need to get the token by splitting 
    
    // if authHeader exists then take the token value
    const token = authHeader && authHeader.split(" ")[1];
    
    if (token == null){
        return res.sendStatus(401);
    }
    
    // after accesssing token, verify it
    // verify has callback
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err){
            res.sendStatus(403);
        }
        else{
            
            // set user object in request
            req.user = user;
            next();
        }
    });
    
}

// logout route will delete refresh token


function generateAccessToken(user) {
    return jwt.sign( user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "60s"});
}



// route for getting a new token on passing refresh token

app.post("/token", (req, res) => {

    const refreshToken = req.body.token;
    if(refreshToken == null){
        res.sendStatus(401);
    }
    if(!refreshTokens.includes(refreshToken)){
        return res.sendStatus(403);
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if(err){
            // console.log(err);
            res.sendStatus(403);
        }
        else{

            // the user object that we get in callback has additional information
            // like issued at etc, so we need to pass specific properties 
            const accessToken = generateAccessToken({name : user.name});
            res.json({accessToken : accessToken}); 
        }
    })

})

// to delete refresh tokens
app.delete("/logout", (req, res) => {
    refreshTokens = refreshTokens.filter( token => token !== req.body.token );
    res.sendStatus(204);
})


var port = process.env.PORT || 4000;

app.listen(port);