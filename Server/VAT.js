var io 				= require('socket.io')
var Reflect 		= require('harmony-reflect')
var msgModule 		= require('./messages')
var futModule 		= require('./futureManagement')
var serialiseModule = require('./serialise')
var mesModule 		= require('./messageHandler')
var socketModule 	= require('./socketManagement')
var objectModule 	= require('./objectPool')
var sysSpawn 		= require('child_process').spawn;
var externalIp 		= require('externalip')

/////////////////////
//Private lib code //
/////////////////////
var exportCallback = null
var systemBehaviour
var systemRef
var systemId = generateActorId()
console.log("System id: " + systemId)
var systemIp = null
externalIp(function(err,ip){
	systemIp = ip
	if(exportCallback != null){
		exportCallback(actor,systemActor,actors,isolate,futureManager.onResolve,futureManager.onRuin)
	}
})
var futureManager 	= futModule.makeFutureManager()
var messageHandler
var socketManager
var objectPool 		= objectModule.makeObjectPool()
//Map from actor id to the port it is listening on
var actorPortMap = {}
//Map from actor name to actor id 
var actorNameMap = {}
//Map from actor id to actor behaviour
var actorBehaviourMap = {}
//Actor id generation
function generateActorId(){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	})
}

function initActor(behaviour,name,socketPort,creationCallback){
	var actorId = generateActorId()
	actorPortMap[actorId] 		= socketPort
	actorNameMap[name] 			= actorId
	actorBehaviourMap[actorId] 	= behaviour
	var actor = sysSpawn("node" ,['--harmony-proxies','actorProto.js',socketPort])
	actor.stdout.on('data', function (data) {
	  //Make sure that actor has created socket before opening connection
	  //Output contains new line characters, need to search for ready message
	  if(data.toString().search(socketManager.socketReady) != -1){
	  	socketManager.openConnection(systemIp,socketPort,actorId,function(connection){
	  		connection.emit('message',{message: socketManager.systemHandshake})
	  		connection.emit('message',{message: msgModule.makeInitMsg(systemIp,systemId,actorId)})
	  		connection.emit('message',{message: msgModule.makeInjectMsg(serialiseModule.serialise(behaviour),serialiseModule.serialise(systemBehaviour))})
	  		var returnFarRef = serialiseModule.makeRemoteFarRef(socketManager,futureManager,objectPool,systemIp,socketPort,true,systemRef,actorId,objectPool.behaviourId,behaviour)
	  		creationCallback(serialiseModule.generateProxy(returnFarRef))		
	  	},true)
	  }
	  else{
	  	console.log(name + ': ' + data);
	  }
	});
	actor.stderr.on('data', function (data) {
	  console.log(name + ': ' + data);
	});
	actor.on('exit', function (code) {
	  console.log(name + 'exited with code ' + code);
	});
}

/////////////////////
//      API        //
/////////////////////

function isolate(object){
	return serialiseModule.makeIsolate(object)
}


//In contrast to the browser version, workers do not need to load in different dependencies, initActor can directly be called on worker
function actor(behaviour,name,socketPort,creationCallback){
	if(name in actorNameMap){
		throw {name: "ActorAlreadyInUse", message: "Actor " + name + " is already in use", toString:    function(){return this.name + ": " + this.message;} }
	}
	else{
		initActor(behaviour,name,socketPort,creationCallback)
	}
}

function actors(behaviours,names,socketPorts,creationCallback){
	var calledBack 	= 0
	var index 		= 0
	var refs 		= []
	var spawnNext	= function(){
		var behaviour 	= behaviours[index]
		var name 		= names[index]
		var port 		= socketPorts[index]
		var callback 	= function(ref){
			refs[index] = ref
			calledBack 	+= 1
			if(calledBack == behaviours.length){
				creationCallback.apply(creationCallback,refs)
			}
			else{
				index 			+= 1
				spawnNext()
			}
		}
		actor(behaviour,name,port,callback)	
	}
	spawnNext()
}

//System actors can access require and all "main thread stuff"
function systemActor(behaviour,socketPort){
	objectPool.setBehaviour(behaviour)
	socketManager 	= socketModule.makeSocketManager(io,socketPort)
	messageHandler 	= mesModule.makeMessageHandler(futureManager,socketManager,objectPool,true,behaviour,systemId,systemIp)
	socketManager.init(messageHandler)
	socketManager.systemIp = systemIp
	systemBehaviour = behaviour
	systemRef = serialiseModule.makeRemoteFarRef(socketManager,futureManager,objectPool,systemIp,socketPort,true,null,systemId,objectPool.behaviourId,behaviour,null)
	systemBehaviour.onRuin 		= futureManager.onRuin
	systemBehaviour.onResolve	= futureManager.onResolve
	systemBehaviour.isolate 	= serialiseModule.makeIsolate
	//Used to get reference to "local" actor (i.e. spawned on the same machine)
	systemBehaviour.getRef = function(actorName){
		if(actorName in actorNameMap){
			var actorId 		= actorNameMap[actorName]
			var actorBehaviour 	= actorBehaviourMap[actorId]
			var actorPort 		= actorPortMap[actorId]
			var farRef 			= serialiseModule.makeRemoteFarRef(socketManager,futureManager,objectPool,systemIp,actorPort,true,systemRef,actorId,objectPool.behaviourId,actorBehaviour,null)
			return serialiseModule.generateProxy(farRef)
		}
		else{
			throw {name: "UnknownActor",message: "Actor " + actorName + " is unknown", toString:    function(){return this.name + ": " + this.message;} }
		}
	}
	systemBehaviour.getRemoteRef = function(address,port){
		var returnFuture = futureManager.makeFuture()
		var isLocal = address == systemIp
		socketManager.openTempConnection(address,port,function(socket){
			var getRemoteMsg = msgModule.makeGetRemoteMsg(systemId,returnFuture,false,systemIp,systemRef.port)
			socket.emit('message',{message: getRemoteMsg})
		},isLocal)
		return returnFuture
	}
	if("init" in behaviour){
		behaviour.init()
	}

}

//Make sure that external ip is known before methods are invoked (ugly but needed)
module.exports = function(cb){
    if(systemIp != null){
        cb(actor,systemActor,actors,isolate,onResolve,onRuin);
    } else {
        exportCallback = cb;
    }
}



