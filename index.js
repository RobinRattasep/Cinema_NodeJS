const express = require('express');
const app = express();
const fs = require('fs');
const options = {
    key: fs.readFileSync('C:/Users/robin/WebstormProjects/testtcinema/private.key'),
    cert: fs.readFileSync('C:/Users/robin/WebstormProjects/testtcinema/certificate.pem'),
};
//const http = require('http').createServer(app);
const https = require('https');
const server = https.createServer(options, app);
const io = require('socket.io')(server);
const port = 3000;
const path = require('path');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const hour = 60 * 60 * 1000;
const cookieParser = require('cookie-parser');
const cache = require('memory-cache');
app.use(cookieParser('password'));
app.use(cookieParser());




io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});


const movies = [
    { title: 'The Shawshank Redemption', showtimes: ['3:00pm', '7:00pm'] },
    { title: 'The Godfather', showtimes: ['5:00pm', '9:00pm'] },
    { title: 'The Godfather: Part II', showtimes: ['2:00pm', '6:00pm'] },
    { title: 'The Dark Knight', showtimes: ['8:00pm'] },
];


const users = [
    { username: 'admin', password: 'password', isAdmin: true },
    { username: 'user', password: 'password', isAdmin: false }
];

function findUser(username, password) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].username === username && users[i].password === password) {
            return users[i];
        }
    }
    return null;
}

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Validate the input
    if (!username || !password) {
        return res.status(400).json({ error: 'Please provide a username and password' });
    }

    // Check if the username and password match a valid user
    const user = findUser(username, password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create a new buffer and store the user's data in it
    const userBuffer = new Buffer.from(JSON.stringify(user));

    // Store the buffer in a cache
    cache.put('user', userBuffer);

    // Set a cookie with the user's information
    res.cookie('user', user, { signed: true, expires: new Date(Date.now() + hour) });
    // Return a success message
    return res.json({ message: 'You have successfully logged in' });
});

let takenSeats = [];

function isSeatTaken(movie, showtime, seat) {
    return takenSeats.some(s => s.movie === movie && s.showtime === showtime && s.seat === seat);
    const movieExist = movies.some(m => m.title === movie && (m.showtimes.indexOf(showtime) !== -1));

    if (!movieExist) {
        return res.status(400).json({ error: 'Movie or Show time not available' });
    }

}

function markSeatTaken(movie, showtime, seat) {
    takenSeats.push({ movie, showtime, seat });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/movies', async (req, res) => {
    //await sleep(3000)
    res.json(movies);
});

app.post('/book', (req, res) => {
    const { movie, showtime, seat } = req.body;
    // Validate the input
    if (!movie || !showtime || !seat) {
        return res.status(400).json({ error: 'Please provide a movie, showtime and seat to book' });
    }

    const movieExist = movies.some(m => m.title === movie && m.showtimes.includes(showtime));
    if (!movieExist) {
        return res.status(400).json({ error: 'Movie or Show time not available' });
    }

    // Check if the seat is already taken
    if(isSeatTaken(movie, showtime, seat)){
        return res.status(400).json({ error: 'Seat is already taken' });
    }

    //mark the seat as taken
    markSeatTaken(movie, showtime, seat);
    // Return a success message
    return res.json({ success: true, message: `You have successfully booked a ticket for ${movie} at ${showtime} seat ${seat}` });
});


app.post('/add-movie', (req, res) => {
    // check if user is logged in
    if (!req.signedCookies.user) {
        return res.status(401).json({ error: 'You must be logged in to add a movie' });
    }
    // check if user is admin
    if (!req.signedCookies.user.isAdmin) {
        return res.status(401).json({ error: 'You must be an admin to add a movie' });
    }
    // get the movie data from the request body
    const { title, showtimes } = req.body;
    // validate the movie data
    if (!title || !showtimes ) {
        return res.status(400).json({ error: 'Please provide a valid title and showtimes array' });
    }
    // add the movie to the movies array
    const newMovie = req.body;
    newMovie.showtimes = JSON.parse(req.body.showtimes);
    movies.push(newMovie);
    io.emit('newMovie', { title, showtimes });
    return res.json({ message: `Successfully added movie ${title} with showtimes ${showtimes}` });
});


server.listen(port, () => {
    console.log(`Example app listening at https://localhost:${port}`);
});
