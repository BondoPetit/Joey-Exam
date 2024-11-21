const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.redirect('http://localhost:3000/Static/views/start.html');
});

app.get('/static/*', function (req, res) {
    res.sendFile(path.join(__dirname, req.url));
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

