var msgModule 		= require('./messages')
var serialiseModule = require('./serialise')

/////////////////////////////////
//Socket Management Module     //
/////////////////////////////////
var makeSocketManager = function(io,socketPort){

	var socketReady 	= "_READY_"

	var systemHandshake = "_SYSTEM_"

	var socket 			= io(socketPort)

	var connectionMap 	= {}

	var browserMap 		= {}

	var addressMapping 	= {}

	var connect 		= function(address,port,isLocal,onConnect,onMessage,onDisconnect){
		var connection
		if(isLocal){
			connection = require('socket.io-client')('http://localhost:'+port)
		}
		else{
			connection = require('socket.io-client')('http://'+address+":"+port)
		}
		connection.on('connect',function(){
			onConnect(connection)
		})
		connection.on('message',onMessage)
		connection.on('disconnect',onDisconnect)
	}

	//Used to talk to other actors (i.e. sending messages)
	var openConnection  = function(address,port,actorId,connectedCallback,isLocal){
		var onConnect = function(socket){
			connectionMap[actorId] 			= socket
			addressMapping[address + port] 	= actorId 
			connectedCallback(socket)
		}.bind(this)
		var onMessage = function(data){
			this.messageHandler(data.message)
		}.bind(this)
		var onDisconnect = function(){
			//TODO
		}.bind(this)
		connect(address,port,isLocal,onConnect,onMessage,onDisconnect)
	}

	//Called upon requesting remote reference (actor id is unknown)
	var openTempConnection = function(address,port,connectedCallback,isLocal){
		var onConnect = function(socket){
			connectedCallback(socket)
		}
		var onMessage = function(data){
			//Temporary socket, will never got message back here
		}
		var onDisconnect = function(){
			//TODO
		}
		connect(address,port,isLocal,onConnect,onMessage,onDisconnect)
	}

	//Used to overwrite the old id for system (default O) to the one received during init message handle
	var updateConnection = function(oldActorId,newActorId,systemIp){
		var connection = getConnection(oldActorId)
		connectionMap[newActorId] = connection
		this.systemIp = systemIp
	}

	var getConnection 	= function(id){
		return connectionMap[id]
	}

	var getBrowserConnection = function(id){
		return browserMap[id]
	}

	var hasConnection 	= function(actorId){
		return actorId in connectionMap
	}

	var hasBrowserConnection = function(id){
		return id in browserMap
	}

	var mapAddress 		= function(address,port){
		return addressMapping[address+port]
	}

	var knownAddress 	= function(address,port){
		return (address+port) in addressMapping
	}

	var manager 		= {
		socketReady: 			socketReady,
		systemHandshake: 		systemHandshake, 
		getConnection: 			getConnection,
		getBrowserConnection: 	getBrowserConnection,
		updateConnection: 		updateConnection,
		openConnection: 		openConnection,
		openTempConnection:  	openTempConnection,
		hasConnection: 			hasConnection,
		hasBrowserConnection: 	hasBrowserConnection,
		mapAddress: 			mapAddress,
		knownAddress:  			knownAddress,
		socket: 				socket,
		socketPort: 			socketPort,
		systemIp: 				null,
		messageHandler: 		null,
		init: 					function(messageHandler){
			console.log("Actor server listening on : " + socketPort)
			this.messageHandler = messageHandler
			//Create server (i.e. listening) port
			socket.on('connection', function (client) {
			  	client.on('message', function  (data) {
			  		//console.log("Received: " + JSON.stringify(data))
			  		//Message received from system actor, allows us to keep track of socket connection to system actor
			  		if(data.message === systemHandshake){
			  			connectionMap[0] = client
			  		}
			  		else if(msgModule.isGetRemoteMsg(data.message)){
			  			var isBrowser = msgModule.getRemoteIsBrowser(data.message)
			  			//If request comes from a browser add the browser connection to the socket manager (otherwise message contains remote ref)
			  			if(isBrowser){
			  				var fromId = msgModule.getRemoteFromId(data.message)
			  				browserMap[fromId] = client
			  				messageHandler(data.message)
			  			}
			  			else{
			  				messageHandler(data.message)
			  			}
			  		}
			  		else if(msgModule.isBrowserRemoteAccessMsg(data.message)){
			  			var fromId = msgModule.browserRemoteAccessFromId(data.message)
			  			browserMap[fromId] = client
			  			messageHandler(data.message)
			  		}
			  		else if(msgModule.isBrowserRemoteCallMsg(data.message)){
			  			var fromId = msgModule.browserRemoteCallFromId(data.message)
			  			browserMap[fromId] = client
			  			messageHandler(data.message)
			  		}
			  		else if(msgModule.isRouteMsg(data.message)){
			  			var fromId = msgModule.routeFromId(data.message)
			  			browserMap[fromId] = client
			  			messageHandler(data.message)
			  		}
			  		else{
			  			messageHandler(data.message)
			  		}
			  	});
			  	client.on('close', function () { 
			  		//TODO, should something be done on close ? 
			  	});
			});
		},

	}

	return manager	
}

exports.makeSocketManager = makeSocketManager