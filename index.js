const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const cookieParser = require('cookie-parser');

app.use(cookieParser());


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

    // Set a cookie with the user's information
    res.cookie('user', user);
    console.log(user.isAdmin)
    // Return a success message
    return res.json({ message: 'You have successfully logged in' });
});


let takenSeats = [];

function isSeatTaken(movie, showtime, seat) {
    return takenSeats.some(s => s.movie === movie && s.showtime === showtime && s.seat === seat);
    const movieExist = movies.some(m => m.title === movie && m.showtimes.includes(showtime));

    if (!movieExist) {
        return res.status(400).json({ error: 'Movie or Show time not available' });
    }

}

function markSeatTaken(movie, showtime, seat) {
    takenSeats.push({ movie, showtime, seat });
}



app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/movies', (req, res) => {
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


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
