const express = require('express');
const app = express();
const fs = require('fs');
const options = {
    key: fs.readFileSync('private.key'),
    cert: fs.readFileSync('certificate.pem'),
};
//const http = require('http').createServer(app);
const https = require('https');
const server = https.createServer(options, app);
const io = require('socket.io')(server);
const port = 3000;
const path = require('path');
app.use(express.json())
const cookieParser = require('cookie-parser');
const cache = require('memory-cache');
app.use(cookieParser('password'));
app.use(cookieParser());
const yamlJs = require("yamljs")
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = yamlJs.load('./swagger.yaml');


const {OAuth2Client} = require('google-auth-library');
const googleOAuth2Client = new OAuth2Client('301229724153-uqr45k3dpt7ivu1mmj9d5cv2e3hjaq5m.apps.googleusercontent.com');


async function getDataFromGoogleJwt(token) {
    const ticket = await googleOAuth2Client.verifyIdToken({
        idToken: token,
        audience: '301229724153-uqr45k3dpt7ivu1mmj9d5cv2e3hjaq5m.apps.googleusercontent.com',
    });
    return ticket.getPayload();
}

app.post('/oAuth2Login', async (req, res) => {
    try {
        const dataFromGoogleJwt = await getDataFromGoogleJwt(req.body.credential)
        if (dataFromGoogleJwt) {
            console.log(dataFromGoogleJwt.sub)
            console.log(users.findBy('sub', dataFromGoogleJwt.sub))
            let user = users.findBy('sub', dataFromGoogleJwt.sub);
            if (!user) {
                user = createUser({
                    email: dataFromGoogleJwt.email,
                    password: null,
                    isAdmin: false,
                    sub: dataFromGoogleJwt.sub
                })
            }
            const session = createSession(user.id);
            console.log("oAuth2Login", `${dataFromGoogleJwt.name} (${dataFromGoogleJwt.email}) logged in with Google OAuth2 as user ${user.email}`);
            res.status(201).send({
                sessionId: session.id, isAdmin: user.isAdmin
            })
        }
    } catch (err) {
        return res.status(400).send({error: "Unseccusful login"});
    }
});

function createUser(user) {
    // Find max id from users using reduce
    const maxId = users.reduce((max, p) => p.id > max ? p.id : max, 0);

    user.id = maxId + 1;
    users.push(user)
    return user;
}

function createSession(userId) {
    // Find max id from sessions using reduce
    let newSession = {
        id: sessions.reduce((max, p) => p.id > max ? p.id : max, 0) + 1,
        userId
    }
    sessions.push(newSession)
    return newSession
}


function requireAdmin(req, res, next) {

    if (!req.isAdmin) {
        return res.status(401).send({error: 'You are not an admin'})
    }

    next()
}

function requireLogin(req, res, next) {


    // Check that there is an authorization header
    if (!req.headers.authorization) {
        return res.status(401).send({error: 'No authorization header'})
    }

    // Check that the authorization header is a bearer token
    const [authType, sessionIdAsText] = req.headers.authorization.split(' ');
    if (authType !== 'Bearer') {
        return res.status(401).send({error: 'Authorization header is not a bearer token'})
    }

    // Convert the sessionId to a number
    const sessionId = Number(sessionIdAsText);

    // Check that the token is valid
    if (!sessionIdAsText || isNaN(sessionId)) {
        return res.status(401).send({error: 'No token'})
    }

    // Get session from sessions
    console.log('token', sessionId)
    console.log('sessions', sessions)
    const session = sessions.findBy('id', sessionId);

    // Check that the token is in the sessions
    if (!session) {
        return res.status(404).send({error: 'Session not found'})

    }

    // Check that the user exists
    const user = users.findById(session.userId);
    if (!user) {
        return res.status(404).send({error: 'Your session does not have an existing user account associated with it'})
    }

    req.sessionId = user.id
    req.isAdmin = user.isAdmin

    next()
}

Array.prototype.findById = function (id) {
    return this.findBy('id', id)
}

Array.prototype.findBy = function (field, value) {
    return this.find(function (x) {
        return x[field] === value
    })
}

Array.prototype.findByMany = function (props) {
    return users.find(user => {
        return Object.keys(props).every(prop => user[prop] === props[prop])
    })
}


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});


const movies = [
    {title: 'The Shawshank Redemption', showtimes: ['3:00pm', '7:00pm']},
    {title: 'The Godfather', showtimes: ['5:00pm', '9:00pm']},
    {title: 'The Godfather: Part II', showtimes: ['2:00pm', '6:00pm']},
    {title: 'The Dark Knight', showtimes: ['8:00pm']},
];


const users = [
    {id: 1, email: "Admin", password: "Password", isAdmin: true, sub: "101164125125031959143"},
    {id: 2, email: "User", password: "Password", isAdmin: false}
]

let sessions = [{id: 1, userId: 1}]


app.post('/sessions', async (req, res) => {
    const {username, password} = req.body;

    // Validate the input
    if (!username || !password) {
        return res.status(400).json({error: 'Please provide a username and password'});
    }

    // Check if the username and password match a valid user
    const user = users.findByMany({email: username, password: password});

    //const user = findUser(username, password);
    if (!user) {
        return res.status(401).json({error: 'Invalid username or password'});
    }

    // Create a new buffer and store the user's data in it
    const userBuffer = new Buffer.from(JSON.stringify(user));

    // Store the buffer in a cache
    cache.put('user', userBuffer);

    // Set a cookie with the user's information
    const session = createSession(user.id);
    res.status(201).send({
        sessionId: session.id, isAdmin: user.isAdmin
    })
});


let takenSeats = [];

function isSeatTaken(movie, showtime, seat) {
    return takenSeats.some(s => s.movie === movie && s.showtime === showtime && s.seat === seat);

}

function markSeatTaken(movie, showtime, seat) {
    takenSeats.push({movie, showtime, seat});
}


app.use(express.static(path.join(__dirname, 'views')));

//app.get('/', (req, res) => {
//    res.sendFile(path.join(__dirname, 'public', 'index.html'));
//});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/movies', async (req, res) => {
    //await sleep(3000)
    res.json(movies);
});


app.use(function (err, req, res, next) {
    // console.error(err.stack)
    return res.status(err.statusCode).json({error: (err.message)});
})


app.post('/bookings', requireLogin, (req, res) => {
    const {movie, showtime, seat} = req.body;
    // Validate the input
    if (!movie || !showtime || !seat) {
        return res.status(400).json({error: 'Please provide a movie, showtime and seat to book'});
    }

    const movieExist = movies.some(m => m.title === movie && m.showtimes.includes(showtime));
    if (!movieExist) {
        return res.status(400).json({error: 'Movie or Show time not available'});
    }

    // Check if the seat is already taken
    if (isSeatTaken(movie, showtime, seat)) {
        return res.status(400).json({error: 'Seat is already taken'});
    }

    //mark the seat as taken
    markSeatTaken(movie, showtime, seat);
    // Return a success message
    return res.json({
        success: true,
        message: `You have successfully booked a ticket for ${movie} at ${showtime} seat ${seat}`
    });
});


app.post('/movies', requireLogin, requireAdmin, (req, res) => {

    // get the movie data from the request body
    const {title, showtimes} = req.body;
    // validate the movie data
    if (!title || !showtimes) {
        return res.status(400).json({error: 'Please provide a valid title and showtimes array'});
    }
    // add the movie to the movies array
    const newMovie = req.body;
    newMovie.showtimes = req.body.showtimes;
    movies.push(newMovie);
    io.emit('newMovie', {title, showtimes});
    return res.json({message: `Successfully added movie ${title} with showtimes ${showtimes}`});
});


server.listen(port, () => {
    console.log(`Example app listening at https://localhost:${port}`);
});