var socket = io();
$('form').submit(function(){
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
});

$( "#music-button" ).click(function() {
    socket.emit('init', 'stream.wav');
    console.log("Stream opened");
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia){
        navigator.getUserMedia({audio: true,video: false}, initializeRecorder, errorCallback);
    } else {
        alert ('Bad browser');
    }

    function errorCallback(error){
        console.log(error);
    };

    function initializeRecorder(stream) {
        audioContex = new (window.AudioContext || window.webkitAudioContext)();
        window.source = audioContex.createMediaStreamSource(stream);
        var bufferSize = 2048;
        var recorder = audioContex.createScriptProcessor(bufferSize, 1, 1);
        recorder.onaudioprocess = recorderProcess;
        source.connect(recorder);
        recorder.connect(audioContex.destination);
    };
    function recorderProcess(e) {
        var left = e.inputBuffer.getChannelData(0);
        socket.emit('record',convertFloat32ToInt16(left));
    };
    function convertFloat32ToInt16(buffer) {
        l = buffer.length;
        buf = new Int16Array(l);
        while (l--) {
            buf[l] = Math.min(1, buffer[l])*0x7FFF;
        }
        return buf.buffer;
    }
});

$( "#stop-button" ).click(function() {
    socket.emit('close');
    socket.close();
});

