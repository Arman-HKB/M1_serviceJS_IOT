var express = require('express');
var router = express.Router();

// GET Home page
router.get('/', function(req, res, next) {
  res.render('index', {page:'Home', menuId:'home'});
});

// GET Info page
router.get('/info', function(req, res, next) {
  res.render('info', {page:'Info', menuId:'info'});
});

module.exports = router;