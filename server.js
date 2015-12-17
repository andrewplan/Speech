var express = require('express');
var app = express();
var fs = require('fs');
var wav = require('wav');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var BinaryServer = require('binaryjs').BinaryServer;

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  res.sendFile('/index.html');
});

io.on('connection', function(socket){
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });

});

http.listen(3000, function(){
  console.log('listening on localhost:3000');
});

binaryServer = BinaryServer({port:3001});
var outFile="test.wav";
binaryServer.on('connection', function(client){
    console.log('new binary connection');
    var fileWriter = new wav.FileWriter(outFile, {
        channels: 1,
        sampleRate: 48000,
        bitDepth: 16
    });
    client.on('stream', function(stream, meta){
        console.log('new stream');

        stream.pipe(fileWriter);
        //stream.on('data', function(chunk){
            //console.log(chunk);
        //});
        stream.on('end', function(){
            fileWriter.end();
            console.log('file');
        });
    });
});

