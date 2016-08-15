define(['./messages','./futureManagement','./serialise','./channelManagement','./messageHandler','./socketManagement','./objectPool'], function(msgModule,futModule,serialiseModule,channelModule,msgHandleModule,socketModule,objectModule) {
/////////////////////
//Private lib code //
/////////////////////


var exportCallback = null
var systemBehaviour
var systemId = generateActorId()
//console.log("System id: " + systemId)
var systemIp = null
var channelManager 	= channelModule.makeManager()
var futureManager 	= futModule.makeFutureManager()
var socketManager 	= socketModule.makeSocketManager()
var objectPool 		= objectModule.makeObjectPool()
var messageHandler
//Actor id generation
function generateActorId(){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	})
}

//Get client Ip
$(document).ready(function () {
    $.getJSON("http://jsonip.com/?callback=?", function (data) {
        systemIp = data.ip
        if(exportCallback != null){
        	console.log(data.ip)
        	exportCallback(actor,systemActor,futureManager.onResolve,futureManager.onRuin)
        }
    });
});

function removeProperty(object,propertyName){
	var retObject = {}
	for(var property in object){
		if(property != propertyName){
			retObject[property] = object[property]
		}
	}
	return retObject
}

//An actor might not load other modules before the system actor initialises them.
//system actor therefore needs to wait until a created actor has loaded all dependencies
function makePreLoadBehaviour(worker,id,behaviour){
	return function(e){
		if(msgModule.isLoadedMsg(e.data)){
			worker.postMessage(msgModule.makeInitMsg(systemIp,systemId,id))
			//TODO, have to remove selfRef from serialised object to avoid cyclic serialisation issues. Need to provide cleaner fix for this
			worker.postMessage(msgModule.makeInjectMsg(serialiseModule.serialise(behaviour),serialiseModule.serialise(removeProperty(systemBehaviour,"selfRef"))))
		}
		else if(msgModule.isImportedMsg(e.data)){
			//Switch worker on message handler to standard system behaviour
			worker.onmessage = messageHandler
			initActor(worker,id,behaviour)
		}
		else{
			throw new Error("Worker active before initialisation")
		}
	}
}

function initActor(worker,workerId,behaviour){
	//Open a channel between new worker and every other worker in system
	for(i in channelManager.actorMap){
		if(i != workerId){
			var nextWorker 	 = channelManager.actorMap[i]
			var nextWorkerId = i 
			var channel 	 = new MessageChannel()
			nextWorker.postMessage(msgModule.makeChannelOpenMsg(workerId),[channel.port1])
			worker.postMessage(msgModule.makeChannelOpenMsg(nextWorkerId),[channel.port2])
		}
	}
	channelManager.actorInitiated(workerId)
}

/////////////////////
//      API        //
/////////////////////

function actor(behaviour,name){
	function spawn(){
		var worker 			= new Worker("./ActorProto.js");
		var workerId 		= generateActorId();
		channelManager.newChannel(name,workerId,worker,behaviour,false)
		worker.onmessage 	= makePreLoadBehaviour(worker,workerId,behaviour);
		return serialiseModule.generateProxy(serialiseModule.makeFarRef(channelManager,futureManager,objectPool,systemId,workerId,objectPool.behaviourId,behaviour))
	}
	if(typeof name === 'undefined'){
		return spawn()
	}
	else{
		if(channelManager.hasNamedActor(name)){
			throw {name: "ActorAlreadyInUse", message: "Actor " + name + " is already in use", toString:    function(){return this.name + ": " + this.message;} }
		}
		else{
			return spawn()
		}
	}
}

function systemActor(behaviour){
	//Serialise and parse behaviour to cut-off its scope (i.e. simulate regular actor behaviour)
	//This actually makes programming against it a lot harder (TODO)
	//var serialisedBehaviour 		= serialiseModule.serialise(behaviour)
	//systemBehaviour 				= serialiseModule.parse(serialisedBehaviour)
	systemBehaviour 				= behaviour
	objectPool.setBehaviour(systemBehaviour)
	systemBehaviour.onResolve 		= futureManager.onResolve
	systemBehaviour.onRuin 			= futureManager.onRuin
	systemBehaviour.isolate 		= serialiseModule.makeIsolate
	systemBehaviour.getRef 			= function(actorName){
		if(channelManager.hasNamedActor(actorName)){
			var actorId 		= channelManager.getActorId(actorName)
			var actorBehaviour 	= channelManager.getActorBehaviour(actorId)
			return serialiseModule.generateProxy(serialiseModule.makeFarRef(channelManager,futureManager,objectPool,systemId,actorId,objectPool.behaviourId,actorBehaviour))
		}
		else{
			throw {name: "UnknownActor",message: "Actor " + actorName + " is unknown", toString:    function(){return this.name + ": " + this.message;} }
		}
	}
	systemBehaviour.selfRef 		= serialiseModule.generateProxy(serialiseModule.makeFarRef(channelManager,futureManager,objectPool,systemId,systemId,objectPool.behaviourId,systemBehaviour))
	systemBehaviour.getRemoteRef 	= function(address,port){
		var returnFuture 	= futureManager.makeFuture()
		socketManager.openConnection(address,port,function(socket){
			var request 	 = msgModule.makeGetRemoteMsg(systemId,returnFuture,true)
			//Actor server will resolve future with remote far reference to requested actor
			socket.emit('message',{message: request})
		})
		return returnFuture
	}
	messageHandler 					= msgHandleModule.makeMessageHandler(channelManager,socketManager,futureManager,objectPool,true,systemBehaviour,systemId,systemIp)
	socketManager.init(messageHandler)
	socketManager.systemIp = systemIp
	if("init" in systemBehaviour){
		systemBehaviour.init.call(systemBehaviour)
	}
}

return function(cb){
	if(systemIp != null){
	    cb(actor,systemActor,onResolve,onRuin);
	} else {
	    exportCallback = cb;
	}
}

})


