var express = require('express');
var httpreq = require('httpreq');
var fs = require('fs');
var app = express();
var watson = require('watson-developer-cloud');
var config = require('./config');

var recordingsDir = '/recordings/';
const MIN_CONFIDENCE = 0;

function sendSms(text) {
  httpreq.post('https://api4.apidaze.io/f0c8b871/sms/send', {
    parameters: {
      api_secret: config.apidaze_key,
      number: config.sms_number,
      body: text
    }
  }, function(err, res) {
    if (err) {
      console.log(err);
    } else {
      console.log(res.body);
      console.log("Succssfully. sent sms");
    }
  });
}

function stringifyKeywords(data) {
  var keywords = data.keywords.reduce(function(previousValue, currentValue) {
    var token = '';
    if (previousValue !== "") {
      token = ', ';
    }
    return previousValue += token + currentValue.text;
  }, "");
  var smsText = "You had a conversation about: " + keywords;
  console.log(smsText);
  sendSms(smsText);
}


function getKeywords(text) {
  console.log("Calling keyword extractor");
  httpreq.get('http://gateway-a.watsonplatform.net/calls/text/TextGetRankedKeywords', {
    parameters: {
      apikey: config.api_key,
      text: text,
      keywordExtractMode: 'strict',
      maxRetrieve: 10,
      sentiment: 1,
      outputMode: 'json'
    }
  }, function(err, res) {
    if (err) {
      console.log(err);
    } else {
      console.log(res.body);
      return stringifyKeywords(JSON.parse(res.body));
    }
  })
}

function runTranscript(uniqueRef) {
  var path = __dirname + recordingsDir + uniqueRef;
  console.log("Sending " + path + " to watson");

  var speech_to_text = watson.speech_to_text({
    username: config.username,
    password: config.password,
    version: "v1"
  });

  var params = {
    audio: fs.createReadStream(path),
    content_type: 'audio/wav',
    timestamps: true,
    word_alternatives: 0.9,
    model: 'en-UK_NarrowbandModel',
    continuous: true
  };

  speech_to_text.recognize(params, function(err, transcript) {
    if (err) {
      console.error(err);
    } else {
      console.log(JSON.stringify(transcript));
      var text = transcript.results.reduce(function(prev, current) {
        if (current.alternatives[0].confidence > MIN_CONFIDENCE) {
          return prev += current.alternatives[0].transcript;
        }
        else {
          return prev;
        }
      }, "");
      console.log(text);
      getKeywords(text);
    }
  });
}

function saveRecording(recordingUrl, uniqueRef) {
  httpreq.get(recordingUrl, {
    binary: true
  }, function(err, dlres) {
    if (err) {
      console.log(err);
    } else {
      fs.writeFile(__dirname + recordingsDir + uniqueRef, dlres.body, function(err) {
        if (err)
          console.error("error writing " + uniqueRef + " file");
        else
          console.log("stored recording at " + uniqueRef);
        runTranscript(uniqueRef);
      });
    }
  });
}

app.get('/', function(req, res) {
  res.send('Thanks for sending me the URL ' + req.query.recordingUrl);
  console.log('Received URL: ' + req.query.recordingUrl);
  var uniqueRef = req.query.recordingUrl.split('/');
  uniqueRef = uniqueRef[uniqueRef.length - 1];
  setTimeout(saveRecording, 1000, req.query.recordingUrl, uniqueRef);
});


app.listen(3000, function() {
  console.log('Transcription service listening on port 3000!');
});
