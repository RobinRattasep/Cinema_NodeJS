const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

const movies = [
    { title: 'The Shawshank Redemption', showtimes: ['3:00pm', '7:00pm'] },
    { title: 'The Godfather', showtimes: ['5:00pm', '9:00pm'] },
    { title: 'The Godfather: Part II', showtimes: ['2:00pm', '6:00pm'] },
    { title: 'The Dark Knight', showtimes: ['8:00pm'] },
];

app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/movies', (req, res) => {
    res.json(movies);
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
