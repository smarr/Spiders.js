var msgModule 		= require('./messages')
var serialiseModule = require('./serialise')

var makeMessageHandler = function(futureManager,socketManager,objectPool,isSystem,systemBehaviour,sysId,sysIp){



	/////////////////////
	//Utils 		   //
	/////////////////////
	var actorId
	var systemId
	var systemIp
	var behaviour
	var selfRef

	if(isSystem){
		behaviour 	= systemBehaviour
		actorId 	= sysId
		systemId 	= sysId
		systemIp 	= sysIp
		selfRef 	= serialiseModule.makeRemoteFarRef(socketManager,futureManager,objectPool,systemIp,socketManager.socketPort,true,null,actorId,objectPool.behaviourId,behaviour)
	}

	var returnRemoteFarRef = function(object){
		if(serialiseModule.isProxy(object)){
			var farRef = serialiseModule.proxyToFarRef(object)
			return serialiseModule.serialise(farRef)
		}
		else{
			var oId 		= objectPool.newObject(object)
			var farRef 		= serialiseModule.makeRemoteFarRef(socketManager,futureManager,objectPool,systemIp,socketManager.socketPort,true,selfRef,actorId,oId,object)
			return serialiseModule.serialise(farRef)
		}
	}

	var tryReturn 	= function(object,property,isMethod,args,ruinHandler,returnHandler){
		var ruined 		= false
		var result
		var exception
		if(isMethod){
			try{
				result = object[property].apply(object,args)
			}
			catch(err){
				ruined 		= true
				exception 	= err
			}
		}
		else{
			try{
				result = object[property]
			}
			catch(err){
				ruined 		= true
				exception 	= err
			}
		}
		if(ruined){
			ruinHandler(exception)
		}
		else{
			returnHandler(result)
		}
	}

	var sendMessage = function(toRef,message){
		if(socketManager.hasConnection(toRef.actorId)){
			var socket = socketManager.getConnection(toRef.actorId)
			socket.emit('message',message)
		}
		else{
			var local = systemIp == toRef.address
			socketManager.openConnection(toRef.address,toRef.port,toRef.actorId,function(socket){
				socket.emit('message',message)
			},local)
		}
	}

	/////////////////////
	//system -> other  //
	/////////////////////

	var handleInit 			= function(initMsg){
		actorId = msgModule.initMsgActorId(initMsg)
		systemId = msgModule.initMsgSystemId(initMsg)
		systemIp = msgModule.initMsgSystemIp(initMsg)
		socketManager.updateConnection(0,systemId,systemIp)
		//console.log("Actor init with id: " + actorId)
	}

	var handleInject 		= function(injectMsg){
		behaviour 				= serialiseModule.parse(msgModule.injectActorBeh(injectMsg))
		objectPool.setBehaviour(behaviour)
		selfRef 				= serialiseModule.makeRemoteFarRef(socketManager,futureManager,objectPool,systemIp,socketManager.socketPort,true,null,actorId,objectPool.behaviourId,behaviour)
		var systemBehaviour 	= serialiseModule.parse(msgModule.injectSystemBeh(injectMsg))
		var systemRef 			= serialiseModule.makeRemoteFarRef(socketManager,futureManager,objectPool,systemIp,socketManager.socketPort,true,selfRef,systemId,objectPool.behaviourId,systemBehaviour)
		behaviour.system 		= serialiseModule.generateProxy(systemRef)
		behaviour.onRuin 		= futureManager.onRuin
		behaviour.onResolve 	= futureManager.onResolve
		behaviour.isolate 		= serialiseModule.makeIsolate
		behaviour.selfRef 		= serialiseModule.generateProxy(selfRef)
		behaviour.getRemoteRef 	= function(address,port){
			var returnFuture = futureManager.makeFuture()
			var isLocal = address == systemIp
			socketManager.openTempConnection(address,port,function(socket){
				var getRemoteMsg = msgModule.makeGetRemoteMsg(actorId,returnFuture,false,systemIp,selfRef.port)
				socket.emit('message',{message: getRemoteMsg})
			},isLocal)
			return returnFuture
		}
		if("imports" in behaviour){
			for(var i in behaviour.imports){
				var exp = require(behaviour.imports[i])
				for(var i in exp){
					behaviour[i] = exp[i]
				}
			}
			if("init" in behaviour){
				behaviour.init()
			}
		}
		else{
			if("init" in behaviour){
				behaviour.init()
			}
		}
	}

	var handleChannelOpen 	= function(channelMsg){
		var otherActorId 			= msgModule.channelOpenMsgId(channelMsg)
		var otherActorSocketPort	= msgModule.channelOpenMsgSocketPort(channelMsg)
		var onConnection 			= function(connection){
			socketManager.newConnection(connection,otherActorId)
		}
		var onMessage 				= function(data){
			dispatcher(data.message)
		}
		var onDisconnect 			= function(){
			//TODO
		}
		socketManager.spawnClientSocket('http://localhost:'+otherActorSocketPort,onConnection,onMessage,onDisconnect)
	}

	/////////////////////
	//any -> any       //
	/////////////////////

	var handleRemoteAccess 	= function(accessMsg){
		var fieldName 		= msgModule.remoteAccessName(accessMsg)
		var from			= msgModule.remoteAccessFromRef(accessMsg)
		var objectId 		= msgModule.remoteAccessObjectId(accessMsg)
		var future 			= msgModule.remoteAccessFuture(accessMsg)
		var ruinHandler 	= function(exception){
			var ruinMsg = msgModule.makeRuinMsg(future,serialiseModule.serialise(exception))
			sendMessage(from,{message: ruinMsg})
		}
		var returnHandler 	= function(result){
			if(serialiseModule.shouldFarRef(result)){
				result = returnRemoteFarRef(result)
			}
			var resolveMsg = msgModule.makeResolveMsg(future,result)
			sendMessage(from,{message: resolveMsg})
		}
		tryReturn(objectPool.getObject(objectId),fieldName,false,[],ruinHandler,returnHandler)
	}

	var handleRemoteCall 	= function(callMsg){
		var methodName 	= msgModule.remoteCallName(callMsg)
		var args 		= msgModule.remoteCallArgs(callMsg)
		var from 		= msgModule.remoteCallFromRef(callMsg)
		var objectId 	= msgModule.remoteCallObjectId(callMsg)
		var future 		= msgModule.remoteCallFuture(callMsg)
		var arguments 	= []
		for(i in args){
			var next = args[i]
			if(serialiseModule.isSerialisedRemoteFarRef(next)){
				var oldRef = serialiseModule.parse(next)
				var newRef = serialiseModule.renewRemoteFarRef(oldRef,socketManager,futureManager,objectPool,selfRef)
				var proxy  = serialiseModule.generateProxy(newRef)
				arguments.push(proxy)
			}
			else{
				arguments.push(next)
			}
		}
		var ruinHandler = function(exception){
			var ruinMsg = msgModule.makeRuinMsg(future,serialiseModule.serialise(exception))
			sendMessage(from,{message: ruinMsg})
		}
		var returnHandler = function(result){
			if(serialiseModule.shouldFarRef(result)){
				result = returnRemoteFarRef(result)
			}
			var resolveMsg = msgModule.makeResolveMsg(future,result)
			sendMessage(from,{message: resolveMsg})
		}
		tryReturn(objectPool.getObject(objectId),methodName,true,arguments,ruinHandler,returnHandler)
	}

	var handleGetRemote 	= function(message){
		var isBrowser = msgModule.getRemoteIsBrowser(message)
		if(isBrowser){
			var fromId = msgModule.getRemoteFromId(message)
			var future = msgModule.getRemoteFuture(message)
			var socket = socketManager.getBrowserConnection(fromId)
			var resolveMsg = msgModule.makeResolveMsg(future,serialiseModule.serialise(selfRef))
			socket.emit('message',{message: resolveMsg})
		}
		else{
			var fromId 		= msgModule.getRemoteFromId(message)
			var fromAddress = msgModule.getRemoteFromAddress(message)
			var fromPort 	= msgModule.getRemoteFromPort(message)
			var future 		= msgModule.getRemoteFuture(message)
			var resolveMsg 	= msgModule.makeResolveMsg(future,serialiseModule.serialise(selfRef))
			sendMessage({actorId: fromId, address: fromAddress,port: fromPort},{message: resolveMsg})
		}
	}

	var handleBrowserRemoteAccessMsg = function(remoteAccessMsg){
		var fieldName 	= msgModule.browserRemoteAccessName(remoteAccessMsg)
		var fromId 		= msgModule.browserRemoteAccessFromId(remoteAccessMsg)
		var objectId 	= msgModule.browserRemoteAccessObjectId(remoteAccessMsg)
		var future 		= msgModule.browserRemoteAccessFuture(remoteAccessMsg)
		var socket 		= socketManager.getBrowserConnection(fromId)
		var ruinHandler = function(exception){
			var ruinMsg = msgModule.makeRuinMsg(future,serialiseModule.serialise(exception))
			socket.emit('message',{message: ruinMsg})
		}
		var returnHandler = function(result){
			if(serialiseModule.shouldFarRef(result)){
				result = returnRemoteFarRef(result)
			}
			var resolveMsg = msgModule.makeResolveMsg(future,result)
			socket.emit('message',{message: resolveMsg})
		}
		tryReturn(objectPool.getObject(objectId),fieldName,false,[],ruinHandler,returnHandler)
	}

	var handleBrowserRemoteCallMsg = function(remoteCallMsg){
		var methodName 	= msgModule.browserRemoteCallName(remoteCallMsg)
		var methodArgs 	= msgModule.browserRemoteCallArgs(remoteCallMsg)
		var fromId 		= msgModule.browserRemoteCallFromId(remoteCallMsg)
		var objectId 	= msgModule.browserRemoteCallObjectId(remoteCallMsg)
		var future 		= msgModule.browserRemoteCallFuture(remoteCallMsg)
		var socket 		= socketManager.getBrowserConnection(fromId)
		var arguments 	= []
		for(var i in methodArgs){
			var next = methodArgs[i]
			if(serialiseModule.isSerialisedRemoteFarRef(next)){
				var oldRef = serialiseModule.parse(next)
				var newRef = serialiseModule.makeFCRemoteFarRef(oldRef,socketManager,futureManager,objectPool,selfRef)
				var proxy  = serialiseModule.generateProxy(newRef)
				arguments.push(proxy)
			}
			else{
				arguments.push(next)
			}
		}
		var ruinHandler = function(exception){
			var ruinMsg = msgModule.makeRuinMsg(future,serialiseModule.serialise(exception))
			socket.emit('message',{message: ruinMsg})
		}
		var returnHandler = function(result){
			if(serialiseModule.shouldFarRef(result)){
				result = returnRemoteFarRef(result)
			}
			var resolveMsg = msgModule.makeResolveMsg(future,result)
			socket.emit('message',{message: resolveMsg})
		}
		tryReturn(objectPool.getObject(objectId),methodName,true,arguments,ruinHandler,returnHandler)
	}

	var handleRoute			= function(routeMsg){
		var fromId 		= msgModule.routeFromId(routeMsg)
		var toId 		= msgModule.routeToId(routeMsg)
		var targetId 	= msgModule.routeTargetId(routeMsg)
		var msg 		= msgModule.routeMessage(routeMsg)
		//If we are routing peer messages add address and port of routing server actor to allow return values to flow back
		if(msgModule.isPeerRemoteCallMsg(msg)){
			msgModule.setPeerRemoteCallRouteAdd(msg,selfRef.address)
			msgModule.setPeerRemoteCallRoutePort(msg,selfRef.port)
		};
		if(msgModule.isPeerRemoteAccessMsg(msg)){
			msgModule.setPeerRemoteAccessRouteAdd(msg,selfRef.address)
			msgModule.setPeerRemoteAccessRoutePort(msg,selfRef.port)
		}
		if(socketManager.hasBrowserConnection(targetId)){
			var socket = socketManager.getBrowserConnection(targetId)
			socket.emit('message',{message: msg})
		}
		else{
			throw {name: "BadRoute",message: "Received route message to unknown client", toString:    function(){return this.name + ": " + this.message;} }
		}
	}

	var handleResolve 		= function(resolveMsg){
		var future 	= msgModule.resolveMsgFuture(resolveMsg)
		var value 	= msgModule.resolveMsgVal(resolveMsg)
		//console.log("Resolved to: " + JSON.stringify(value))
		if(serialiseModule.isSerialisedRemoteFarRef(value)){
			var oldRef 			= serialiseModule.parse(value)
			var newRef 
			if(oldRef.isServerOb){
				newRef 			= serialiseModule.renewRemoteFarRef(oldRef,socketManager,futureManager,objectPool,selfRef)
			}
			else{
				newRef 			= serialiseModule.makeFCRemoteFarRef(oldRef,socketManager,futureManager,objectPool,selfRef)
			}
			value  				= serialiseModule.generateProxy(newRef)
		}
		futureManager.resolve(future,value)
	}

	var handleRuin 			= function(ruinMsg){
		var future 		= msgModule.ruinMsgFuture(ruinMsg)
		var exception	= msgModule.ruinMsgException(ruinMsg)
		exception 		= serialiseModule.parse(exception)
		futureManager.ruin(future,exception)
	}


	var dispatcher 			= function(message){
		if(msgModule.isInitMsg(message)){
			handleInit(message)
		};
		if(msgModule.isInjectMsg(message)){
			handleInject(message)
		};
		if(msgModule.isChannelOpenMsg(message)){
			handleChannelOpen(message)
		};
		if(msgModule.isResolveMsg(message)){
			handleResolve(message)
		};
		if(msgModule.isRuinMsg(message)){
			handleRuin(message)
		};
		if(msgModule.isRemoteAccessMsg(message)){
			handleRemoteAccess(message)
		};
		if(msgModule.isRemoteCallMsg(message)){
			handleRemoteCall(message)
		};
		if(msgModule.isGetRemoteMsg(message)){
			handleGetRemote(message)
		};
		if(msgModule.isBrowserRemoteAccessMsg(message)){
			handleBrowserRemoteAccessMsg(message)
		};
		if(msgModule.isBrowserRemoteCallMsg(message)){
			handleBrowserRemoteCallMsg(message)
		};
		if(msgModule.isRouteMsg(message)){
			handleRoute(message)
		}
	}

	return dispatcher
}

exports.makeMessageHandler = makeMessageHandler