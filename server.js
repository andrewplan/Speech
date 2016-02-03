var express     = require('express');
var app         = express();
var fs          = require('fs');
var path        = require('path');
var wav         = require('wav');
var http        = require('http').Server(app);
var io          = require('socket.io')(http);

var streams = [];
var rooms = [];
var port = 4000;
var ip = "0.0.0.0";

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, '/public', 'test.html'));
});

app.use('/',express.static("public"));

io.on('connection', function(socket){
    console.log('>>> Connection'+' ('+io.engine.clientsCount+')');
    rooms = findRooms();
    io.sockets.emit('rooms', rooms);

    socket.on('createRoom', function(name){
        socket.join(name);
        rooms = findRooms();
        io.sockets.emit('rooms', rooms);
    });

    socket.on('joinRoom', function(name){
        console.log(">>> User joined room "+name);
        socket.join(name);
    });

    socket.on('init', function(name, sample_rate){
        var streamTemp = {};
        streamTemp.mood = 'warm';
        streamTemp.wav = new wav.FileWriter('out/'+name+'.wav', {
            channels: 1,
            sampleRate: sample_rate,
            bitDepth: 16
        });
        streamTemp.name = name;
        streams.push(streamTemp);
        console.log('>>> Initialized (mood, wav): '+name);
    });

    socket.on('log', function(data, name){
        var sum = 0
        for(var i in data){
            sum += data[0];
        }
        var avg = sum/i;
        var stream;
        for (var obj in streams){
            if (streams[obj].name === name) {
                stream = streams[obj];
                break;
            }
        }
        //stream.log.write(avg+'\n');
    });

    var i = 1
    socket.on('record', function(data, name){
        socket.broadcast.to(name).emit('stream_chunk', data);
        process.stdout.write('Recording');
        i%3 == 0 ? process.stdout.write(".  \r") :
        i%2 == 0 ? process.stdout.write(".. \r") :
        process.stdout.write("...\r");
        var stream;
        for (var obj in streams){
            if (streams[obj].name === name) {
                stream=streams[obj];
                break;
            }
        }
        stream.wav.write(data);
        i++;
    });
    
    socket.on('close', function(name){
        setTimeout(function(){
            console.log('>>> Close (log, recording): '+name);
            var stream;
            for (var obj in streams){
                if (streams[obj].name === name) {
                    stream=streams[obj];
                    break;
                }
            }
            //stream.log.end();
            stream.wav.end();
            socket.leave(name);
            rooms = findRooms();
            io.sockets.emit('rooms', rooms);
        }
        , 1000);
    });

    socket.on('disconnect', function () {
        rooms = findRooms();
        io.sockets.emit('rooms', rooms);
    });
});

http.listen(port, ip, function(){
  console.log('listening on '+ip+':'+port);
});

function findRooms() {
    var availableRooms = [];
    var rooms = io.sockets.adapter.rooms;
    if (rooms) {
        for (var room in rooms) {
            if (!rooms[room].hasOwnProperty(room)) {
                availableRooms.push(room);
            }
        }
    }
    return availableRooms;
}
