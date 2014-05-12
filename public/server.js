var express = require("express");
var http = require("http");
var https = require("https");
var app = express();

/* serves main page */
app.get("/", function(req, res) {
  res.sendfile('public/index.html')
});

function getResponse(requestLib, url, callback) {
  var response = '';
  requestLib.get(url, function(apiRes) {
    apiRes.on('data', function(chunk) {
      response += chunk;
    });
    apiRes.on('end', function () {
      callback(response);
    });
  }).on('error', function(e) {
    console.log(e);
  });
}

function proxyJsonResponse(requestLib, url, res) {
  getResponse(requestLib, url, function(response) {
    res.header('Content-Type', 'text/json');
    res.send(response);
  });
}

app.get('/buses.json', function(req, res) {
  var apiKey = 'CYy0GVkWFcrXpBLa8AzaA9V3XJzcEXCU';
  var siteId = 9192;
  var timeWindow = 10;
  var apiUrl = 'https://api.trafiklab.se/sl/realtid2/GetAllDepartureTypes.json/' + siteId + '/' + timeWindow + '?key=' + apiKey;

  proxyJsonResponse(https, apiUrl, res);
});

app.get('/trains.json', function(req, res) {
  var apiKey = '1TwHFwkB3OukxAY3DXnFA7ZDjITCBR5U';
  var maxHours = 5;
  var maxItems = 20;
  var stationName = 'Malmö C';
  var apiUrl = 'https://api.trafiklab.se/trafikverket/traininfo/stations/name/' + encodeURIComponent(stationName) + '/departures.json?maxHours=' + maxHours + '&maxItems=' + maxItems + '&key=' + apiKey;

  proxyJsonResponse(https, apiUrl, res);
});

app.get('/facebook.json', function(req, res) {
  var query = "SELECT app_id, coords, author_uid, id, message, page_id, page_type, post_id, tagged_uids, timestamp, type FROM location_post WHERE  author_uid IN (SELECT uid2 FROM friend WHERE uid1 = me()) ORDER BY author_uid";

  var FB = require('fb');
  FB.setAccessToken('CAACEdEose0cBADMtjW5ThMwC1o5lqC15t0X2pjMHXAXrP6vGirAMPIrq2gAGGk0CLl6yzrZA9wwxZA58afr9WeGtDEtq7K6LW1jY5MxDICfZCH2mX78s1TJpZBVdXUUF4551ea1RCvf1UZAVTVwCadWzbaCGRMV3ZCk86l8GrkxUOZC2BoI2RNbHAtkRcUB4ZAsZD');

  FB.api('fql', { q: query }, function (fbRes) {
    if(!fbRes || fbRes.error) {
      console.log(!fbRes ? 'error occurred' : fbRes.error);
      return;
    }
    console.log(fbRes.data);
    res.send(fbRes.data);
  });
});

app.get('/skane.json', function(req, res) {
  var stationId = 80000;
  var apiUrl = 'http://www.labs.skanetrafiken.se/v2.2/stationresults.asp?selPointFrKey=' + stationId;

  getResponse(http, apiUrl, function(response) {
    var xml2js = require("xml2js");
    var xmlParser = new xml2js.Parser();
    xmlParser.parseString(response, function(err, result) {
      var xmlLines = result["soap:Envelope"]["soap:Body"][0]['GetDepartureArrivalResponse'][0]['GetDepartureArrivalResult'][0]['Lines'][0]['Line'];
      if (xmlLines) {
        var _ = require('lodash');
        var lines = _.map(xmlLines, function(xmlLine) {
          return {
            'name': xmlLine['Name'][0]
          }
        });
        res.header('Content-Type', 'text/json');
        res.send(JSON.stringify(lines));
      }
    });
  });
});

app.get(/^(.+)$/, function(req, res){
  console.log('static file request : ' + req.params);
  res.sendfile(__dirname + '/public' + req.params[0]);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
