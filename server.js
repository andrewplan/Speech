var express = require('express');
var app = express();
var fs = require('fs');
var wav = require('wav');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  res.sendFile('/index.html');
});

io.on('connection', function(socket){
    var outFile="test.wav";
    var fileWriter = new wav.FileWriter(outFile, {
        channels: 1,
        sampleRate: 46000,
        bitDepth: 16
    });
    socket.on('init', function(name){
        fileWriter = new wav.FileWriter(name, {
            channels: 1,
            sampleRate: 46000,
            bitDepth: 16
        });
        console.log('init');
    });
    socket.on('record', function(data){
        //console.log(data.length);
        fileWriter.write(data);
    });
    socket.on('close', function(){
        console.log('Close');
        fileWriter.end();
    });

});

http.listen(3000, function(){
  console.log('listening on localhost:3000');
});

