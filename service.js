var path = require('path');
var index = require('./routes/index');

const express = require('express');
const { MongoClient } = require('mongodb');

const service = express();
const port = 6969;

service.use(express.json());

// POST, Insert dans la base de données
service.post('/insert', async (req, res) => {
  try {
    const client = await MongoClient.connect('mongodb+srv://armanhkb:jedetestelenosql@clusteriot.seueo8m.mongodb.net/tp4?retryWrites=true&w=majority');
    const db = client.db('tp4');

    const collection = db.collection('access');
    const result = await collection.insertOne(req.body);

    client.close();

    res.status(201).json({ message: 'Data inserted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET, Récupère les données de la base de données
service.get('/get', async (req, res) => {
  try {
    const client = await MongoClient.connect('mongodb+srv://armanhkb:jedetestelenosql@clusteriot.seueo8m.mongodb.net/tp4?retryWrites=true&w=majority');
    const db = client.db('tp4');

    const collection = db.collection('access');
    const documents = await collection.find().toArray();

    client.close();

    res.status(200).json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

service.set('views', path.join(__dirname, 'views'));
service.set('view engine', 'ejs');

service.use(express.static(path.join(__dirname, 'public')));

// Route
service.use('/', index);

// Lancement du serveur
service.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});