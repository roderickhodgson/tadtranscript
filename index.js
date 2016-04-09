var express = require('express');
var httpreq = require('httpreq');
var fs = require('fs');
var app = express();
var watson = require('watson-developer-cloud');
var config = require('./config');

var recordingsDir = '/recordings/';

function runTranscript(uniqueRef) {
  var path = __dirname + recordingsDir + uniqueRef;
  console.log("Sending " + path+ " to watson");

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
    model: 'en-UK_NarrowbandModel'
  };

  speech_to_text.recognize(params, function (err, transcript) {
    if (err) {
      console.error(err);
    }
    else {
      console.log(transcript.results[transcript.result_index].alternatives[0].transcript);
    }
  });
}

function saveRecording(recordingUrl, uniqueRef) {
  httpreq.get(recordingUrl, {binary: true}, function (err, dlres) {
    if (err) {
      console.log(err);
    } else {
      fs.writeFile(__dirname + recordingsDir + uniqueRef, dlres.body, function (err) {
        if(err)
          console.error("error writing " + uniqueRef + " file");
        else
          console.log("stored recording at " + uniqueRef);
          runTranscript(uniqueRef);
      });
    }
  });
}

app.get('/', function (req, res) {
  res.send('Thanks for sending me the URL ' + req.query.recordingUrl);
  console.log('Received URL: ' +  req.query.recordingUrl);
  var uniqueRef = req.query.recordingUrl.split('/');
  uniqueRef = uniqueRef[uniqueRef.length-1];
  setTimeout(saveRecording, 1000, req.query.recordingUrl, uniqueRef);
});


app.listen(3000, function () {
  console.log('Transcription service listening on port 3000!');
});
