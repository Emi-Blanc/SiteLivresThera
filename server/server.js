// server/server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DATA_FILE = 'books.json';

app.use(cors());
app.use(bodyParser.json());

// Lire les livres
app.get('/books', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Erreur lecture fichier');
    res.json(JSON.parse(data || '[]'));
  });
});

// Sauvegarder les livres
app.post('/books', (req, res) => {
  const books = req.body;
  fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2), err => {
    if (err) return res.status(500).send('Erreur écriture fichier');
    res.send('Données sauvegardées');
  });
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
