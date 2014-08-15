function FPSRelay( io, config ) {
  var fps = io
    // only listen on the fps namespace
    .of('/fps')

    .on('connection', function (socket) {
      // send the last known state to the client on request
      socket.on('refresh', function () {
        refresh( socket );
      });
	socket.on('logONOFF', function (data) { 
		socket.emit('fpsSwitch',{message:"Switching FPS"});
		socket.broadcast.emit('fpsSwitch',{message:"Switching FPS"});
		console.log("FPS Switching"); 
	});
	socket.on('getLOG', function (data) { 
		socket.emit('giveLOG',{message:"Downloading FPS Log"});
		socket.broadcast.emit('giveLOG',{message:data.message});
		console.log("Getting FPS Log"); 
	});

    });

  return {
    io: fps
  }
};


module.exports.relay = FPSRelay;

