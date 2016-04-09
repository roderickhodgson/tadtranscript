var express = require('express');
var httpreq = require('httpreq');
var fs = require('fs');
var app = express();

var recordingCallback;

function saveRecording(recordingUrl, uniqueRef) {
  httpreq.get(recordingUrl, {binary: true}, function (err, dlres) {
    if (err) {
      console.log(err);
    } else {
      fs.writeFile(__dirname + '/recordings/' + uniqueRef, dlres.body, function (err) {
        if(err)
          console.error("error writing " + uniqueRef + " file");
        else
          console.log("stored recording at " + uniqueRef);
      });
    }
    clearInterval(recordingCallback);
  });
}

app.get('/', function (req, res) {
  res.send('Thanks for sending me the URL ' + req.query.recordingUrl);
  console.log('Received URL: ' +  req.query.recordingUrl);
  var uniqueRef = req.query.recordingUrl.split('/');
  uniqueRef = uniqueRef[uniqueRef.length-1];
  recordingCallback = setInterval(saveRecording, 1000, req.query.recordingUrl, uniqueRef);
});


app.listen(3000, function () {
  console.log('Transcription service listening on port 3000!');
});
