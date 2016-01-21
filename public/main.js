var socket = io();

var app = angular.module("Speech",[]);

app.controller('SpeechController', function($scope, $window){
    var sp = this;
    sp.title=null;
    sp.rooms=[];
    sp.recording=false;

    sp.joinRoom = function(name){
        console.log('Joining room');
        socket.emit('joinRoom', name);
    }

    socket.on('rooms', function(rooms){
        sp.rooms = rooms;
        $scope.$apply();
    });

    socket.on('play',function(data){
        playAudio(data)
    })

    function playAudio(buffer) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        var context = new AudioContext();

        source2 = context.createBufferSource();
        audioBuffer2 = context.createBuffer( 1, 2048, context.sampleRate );
        audioBuffer2.getChannelData(0).set(convertInt16ToFloat32(buffer));
        source2.buffer = audioBuffer2;
        source2.connect(context.destination);
        source2.start(0);
    }

    socket.on('count', function(count){
        sp.clientCount = count;
        $scope.$apply();
    });

    navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var source;
    var recorder;
    var stream;

    var analyser = audioCtx.createAnalyser();
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;

    var canvas = document.querySelector('.visualizer');
    var canvasCtx = canvas.getContext("2d");

    var intendedWidth = document.querySelector('#main').clientWidth;

    canvas.setAttribute('width',intendedWidth);

    var drawVisual;
    var localStream;

    this.startRecord = function(){
        if(sp.title){
            socket.emit('createRoom', sp.title);
            this.recording=true;
            if (navigator.getUserMedia) {
                socket.emit('init', sp.title);
                navigator.getUserMedia ( { audio: true }, function(stream) {
                    localStream = stream;
                    source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    var bufferSize = 2048;
                    recorder = audioCtx.createScriptProcessor(bufferSize, 1, 1);
                    recorder.onaudioprocess = recorderProcess;
                    source.connect(recorder);
                    recorder.connect(audioCtx.destination);
                    visualize();
                },
                function(err) {
                    console.log('The following gUM error occured: ' + err);
                }
                );
            } else {
                console.log('getUserMedia not supported on your browser!');
            }
        }
        else{
            alert('Title is needed')
        };
    }

    this.stopRecord = function(){
        this.recording=false;
        socket.emit('close', sp.title);
        localStream.stop();
        recorder.onaudioprocess = null;
        window.cancelAnimationFrame(drawVisual);
    }

    function recorderProcess(e) {
            var left = e.inputBuffer.getChannelData(0);
            socket.emit('record',convertFloat32ToInt16(left), sp.title);
    };

    function convertFloat32ToInt16(buffer) {
        l = buffer.length;
        buf = new Int16Array(l);
        while (l--) {
            buf[l] = Math.min(1, buffer[l])*0x7FFF;
        }
        return buf.buffer;
    }
    function convertInt16ToFloat32(buffer) {
        var array = new Int16Array(buffer);
        l = array.length;
        buf = new Float32Array(l);
        while (l--) {
            buf[l] = array[l]/0x7FFF;
        }
        return buf;
    }

    function visualize() {
        WIDTH = canvas.width;
        HEIGHT = canvas.height;
        analyser.fftSize = 256; 
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);
    
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        
        function draw() {
            drawVisual = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            socket.emit('log',dataArray, sp.title);
            canvasCtx.fillStyle = 'rgb(245,245,245)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
            var barWidth = (WIDTH / bufferLength) * 2.5;
            var barHeight;
            var x = 0;
            for(var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];
                canvasCtx.fillStyle = 'rgb(119,136,153)';
                canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);
                x += barWidth + 1;
            }
        };
        draw();
    }
});
