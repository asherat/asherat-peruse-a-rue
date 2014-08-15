define(
['config', 'bigl', 'stapes', 'socketio'],
function(config, L, Stapes, io) {

  var FPSModule = Stapes.subclass({
    constructor: function() {
      this.socket = null;
    },

    init: function() {
      console.debug('FPS: init');

      var self = this;

      this.socket = io.connect('/fps');

      this.socket.once('connect', function() {
        console.debug('FPS: ready');
        self.emit('ready');
      });

    this.socket.on('message', function(data){ 
        console.log('MSG: ' + data.message);
    });

    this.socket.on('fpsSwitch', function(){
	console.log('FPS Switching');
	logONOFF();
    });

    this.socket.on('giveLOG', function(data){
	console.log('Downloading LOG');
	downloadLog(data.message);
    });

      this.socket.on('connect_failed', function() {
        L.error('FPS: connection failed!');
      });
      this.socket.on('disconnect', function() {
        L.error('FPS: disconnected');
      });
      this.socket.on('reconnect', function() {
        console.debug('FPS: reconnected');
      });
    },

    refresh: function() {
      console.debug('FPŜ: sending refresh');
      this.socket.emit('refresh');
    }
  });

  return FPSModule;
});



//var fpsOut = document.getElementById('fps');
var fps = 60; //max fps
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;
var logging = false;
var bugout = new debugout();
bugout.continous=false;
bugout.useTimestamps=false;
bugout.info=false;

function draw() {
    requestAnimationFrame(draw);
     
    now = Date.now();
    delta = now - then;

    if (delta > interval) {     
        // Just `then = now` is not enough.
        // Lets say we set fps at 10 which means
        // each frame must take 100ms
        // Now frame executes in 16ms (60fps) so
        // the loop iterates 7 times (16*7 = 112ms) until
        // delta > interval === true
        // Eventually this lowers down the FPS as
        // 112*10 = 1120ms (NOT 1000ms).
        // So we have to get rid of that extra 12ms
        // by subtracting delta (112) % interval (100).
        // Hope that makes sense.       
        then = now - (delta % interval);
    }
}

draw();

function downloadLog(str) {
    var file = "data:text/plain;charset=utf-8,";
    var logFile = bugout.getLog();
    var encoded = encodeURIComponent(logFile);
    file += encoded;
    var a = document.createElement('a');
    a.href = file;
    a.target   = '_blank';
    a.download = str + '.fps';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function logONOFF() {
	logging = !logging;
	if (logging){
		bugout.clear();
		bugout.recordLogs = true;
		console.log('Enabled FPS');
	}
	else{
		bugout.getLog();
		bugout.recordLogs = false;
		console.log('Disabled FPS');
	}
}

// Report the fps only every second, to only lightly affect measurements
setInterval(function(){
if(logging)
bugout.log(delta.toFixed(0)); //Ignore decimals
},1000);

