var path = require('path');
var index = require('./routes/index');

const express = require('express');
const { MongoClient } = require('mongodb');

const service = express();
const port = 6969;

const mqtt = require('mqtt');
const mqttClient = mqtt.connect('mqtt://test.mosquitto.org');
const mqttClientUser = mqtt.connect('mqtt://mqtt.eclipseprojects.io');

service.use(express.json());

// Express MVC ---------------------------------------------------------------------
service.set('views', path.join(__dirname, 'views'));
service.set('view engine', 'ejs');

service.use(express.static(path.join(__dirname, 'public')));

service.use('/', index);

// Requests ---------------------------------------------------------------------
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

// MQTT ---------------------------------------------------------------------
const pools = [];
const users = [];

// Suscribe au topic /uca/iot/piscine pour récupérer la liste des piscines
mqttClient.on('connect', () => {
  mqttClient.subscribe('uca/iot/piscine', (err) => {
    if (err) {
      console.error('MQTT subscription error:', err);
    } else {
      console.log('MQTT subscribed to uca/iot/piscine');
    }
  });
});

mqttClient.on('message', (topic, message) => {
  const jsonMessage = JSON.parse(message.toString());
  //console.log('Received MQTT message:', jsonMessage);

  const ident = jsonMessage.info.ident;
  let temperature;
  if(jsonMessage.status.temperature != null) {
    temperature = jsonMessage.status.temperature;
  } else {
    temperature = jsonMessage.temperature;
  }
  const lat = jsonMessage.info.loc.lat;
  const lon = jsonMessage.info.loc.lon;

  const existingItemIndex = pools.findIndex(item => item.ident === ident);
  if (existingItemIndex !== -1) {
    pools[existingItemIndex] = { ident, temperature, lat, lon };
    console.log('Ident updated:', ident);
  } else {
    pools.push({ ident, temperature, lat, lon });
    console.log('New ident added:', ident);
  }
  console.log('Pools:', pools);
});

// Suscribe au topic /uca/waterbnb/# pour récupérer la liste des utilisateurs
mqttClientUser.on('connect', () => {
  mqttClientUser.subscribe('uca/waterbnb/#', (err) => {
    if (err) {
      console.error('MQTT subscription error:', err);
    } else {
      console.log('MQTT subscribed to uca/waterbnb/#');
    }
  });
});

mqttClientUser.on('message', (topic, message) => {
  const jsonMessage = JSON.parse(message.toString());

  const tid = jsonMessage.tid;
  const lat = jsonMessage.lat;
  const lon = jsonMessage.lon;

  const existingItemIndex = users.findIndex(item => item.tid === tid);
  if (existingItemIndex !== -1) {
    users[existingItemIndex] = { tid, lat, lon };
    console.log('Ident updated:', tid);
  } else {
    users.push({ tid, lat, lon });
    console.log('New ident added:', tid);
  }
  console.log('Users:', users);
});

// GET, Retourne la liste des piscines
service.get('/pools', async (req, res) => {
  try {
    res.status(200).json(pools);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET, Retourne la liste des utilisateurs
service.get('/users', async (req, res) => {
  try {
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Lancement du serveur ---------------------------------------------------------------------
service.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});