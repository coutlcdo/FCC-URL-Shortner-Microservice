'use strict';

var express = require('express');
var db = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');
var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// root view
app.get('/', function(req, res, next) {
  app.use('/public', express.static(__dirname + '/public'));
  next();
}, function(req, res){
  res.sendFile(__dirname + '/views/index.html');
});

// Setting DB
var urlsSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

var urls = mongoose.model('urls', urlsSchema);


app.route("/api/shorturl/new").post(function(req, res, next) {
  
  let url4Dns = req.body.url;
  
  if(/[htps]+\:\/*/g.test(url4Dns) == true) {
    
    url4Dns = url4Dns.split("");
    
    function isS(element) {
      if (element === 's') {
        return element;
      }
    }
    
    let indexOfS = url4Dns.findIndex(isS);
    if(indexOfS <= 4) {
      //code with s
      url4Dns = url4Dns.slice(8);
      
    } else {
      //code without s
      url4Dns = url4Dns.slice(7);
    };
    
    url4Dns = url4Dns.join("");
    
  };
  
  dns.lookup(url4Dns, (err, address, family)=>{
    
    if (!address) {
      //res.json({error: "invalid URL"});
      res.send(`<h2>Error! Invalid URL.</h2>`);
    } else {
      next();
    }
    
  });
  
});


// API endpoint
app.post("/api/shorturl/new", async function (req, res) {
  
  let rUrl = req.body.url;
  
  if(/[htps]+\:\/*/g.test(rUrl) == true) {
    rUrl = rUrl;
  } else {
    rUrl = "https://" + rUrl;
  }
  
  let r;
  function getRandomInt(max) {
    r = Math.floor(Math.random() * Math.floor(max));
    r.toString();
  };
  getRandomInt(1000);
  
  
  let url1 = new urls({original_url: rUrl, short_url: r});
  
  if (!(await urls.findOne({short_url: r})) && !(await urls.findOne({original_url: rUrl}))) {
    url1.save(function(err, data) {
      if (err) {
        console.log("An error has occurred");
        return err;
      }
    });
    
    //res.json({original_url: rUrl, short_url: r});
    res.send(`<h2>Your shortned url is <a href='https://swamp-brace.glitch.me/api/shorturl/${r}'>[project_url]/api/shorturl/${r}</a></h2>`);
    
  } else {
    
    async function getShortUrl(aux) {
      try {
        var returnShortUrl = await urls.findOne({original_url: aux})
            .then(function(data) {
              if (!data) {
                // url not found
              }
              return data.short_url;
            })
    
      //console.log(returnShortUrl);
      //res.json({original_url: aux, short_url: returnShortUrl});
      res.send(`<h2>The url posted is already on database, it's link is: <a href='https://swamp-brace.glitch.me/api/shorturl/${returnShortUrl}'>[project_url]/api/shorturl/${returnShortUrl}</a></h2>`);

      } catch(err) {
        // catch unexpected errors
      }};
  
    getShortUrl(rUrl);
    
  };
});

app.get("/api/shorturl/:num", function (req, res) {
  
  let aux = req.params.num;
  
  async function getRealUrl(aux) {
  try {
    var findShortUrlAndReturnRealUrl = await urls.findOne({short_url: aux})
        .then(function(data) {
            if (!data) {
                //url not found
            }
            return data.original_url;
        })
    
    //console.log(findShortUrlAndReturnRealUrl);
    res.redirect(findShortUrlAndReturnRealUrl);

  } catch(err) {
    //catch unexpected errors
  }};
  
  getRealUrl(aux);
  
});


app.listen(port, function () {
  console.log('App listening on port', port);
});