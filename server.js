var express = require("express");
var http = require("http");
var https = require("https");
var app = express();
var moment = require("moment");

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
  var apiKey = process.env.REALTID2_API_KEY;
  var siteId = 9192;
  var timeWindow = 10;
  var apiUrl = 'https://api.trafiklab.se/sl/realtid2/GetAllDepartureTypes.json/' + siteId + '/' + timeWindow + '?key=' + apiKey;

  proxyJsonResponse(https, apiUrl, res);
});

app.get('/trains.json', function(req, res) {
  var apiKey = process.env.TRAININFO_API_KEY;
  var maxHours = 5;
  var maxItems = 20;
  var stationName = 'Malmö C';
  var apiUrl = 'https://api.trafiklab.se/trafikverket/traininfo/stations/name/' + encodeURIComponent(stationName) + '/departures.json?maxHours=' + maxHours + '&maxItems=' + maxItems + '&key=' + apiKey;

  proxyJsonResponse(https, apiUrl, res);
});



app.get('/rejseplanen.json?', function(req, res) {
  //var trainid = 008600755;
  var stationid = req.param('stationid');
  var urlSecret = process.env.REJSEPLANEN_URL_SECRET;
  var date = new Date();
  var time = (date.getHours() +2)%24 + ":" + date.getMinutes();
  var apiUrl = urlSecret + 'departureBoard?id=' + encodeURIComponent(stationid) + '&date=' + moment().zone("0400").zone(-2).format("DD.MM.YY") + '&time=' + moment().zone(-2).format("HH.mm") + '&useBus=0&format=json';

  proxyJsonResponse(http, apiUrl, res);
});
 

app.get('/facebook.json', function(req, res) {
  var query = "SELECT app_id, coords, author_uid, id, message, page_id, page_type, post_id, tagged_uids, timestamp, type FROM location_post WHERE  author_uid IN (SELECT uid2 FROM friend WHERE uid1 = me()) ORDER BY author_uid";
  var tokenSecret = process.env.FB_ACCESS_TOKEN;
  var FB = require('fb');
  FB.setAccessToken(tokenSecret);

  FB.api('fql', { q: query }, function (fbRes) {
    if(!fbRes || fbRes.error) {
      console.log(!fbRes ? 'error occurred' : fbRes.error);
      return;
    }
    res.send(fbRes.data);
  });
});




app.get('/facebookmedea.json', function(req, res) {
	var tokenSecret = process.env.FB_ACCESS_TOKEN;
	var apiUrl ="https://graph.facebook.com/medeamalmo?access_token=" + tokenSecret;
	 proxyJsonResponse(https, apiUrl, res);
});


app.get('/skane.json', function(req, res) {
  var stationId = req.param('stationid');
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
            'name': xmlLine['Name'][0],
            'no': xmlLine['No'][0],
            'trainNo': xmlLine['TrainNo'][0],
            'lineTypeName': xmlLine['LineTypeName'][0],
            'towards': xmlLine['Towards'][0],
            'time': xmlLine['JourneyDateTime'][0]
          }
        });
        res.set({ 'content-type': 'application/json; charset=utf-8' })
        res.send(JSON.stringify(lines));
      }
    });
  });
});

app.get('/flights.json', function(req, res) {
  var appId = process.env.FLIGHTSTATS_APP_ID;
  var appKey = process.env.FLIGHTSTATS_API_KEY;
  var airport = 'CPH';

  var apiUrl = 'https://api.flightstats.com/flex/flightstatus/rest/v2/json/airport/tracks/' + airport + '/dep?appId=' + appId + '&appKey=' + appKey + '&includeFlightPlan=false&maxPositions=1&maxFlights=50';

  getResponse(https, apiUrl, function(response) {
    res.set({ 'content-type': 'application/json; charset=utf-8' })
    res.send(response);
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
