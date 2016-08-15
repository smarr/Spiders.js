define(['./messages','./serialise'], function(msgModule,serialiseModule){


	var makeMessageHandler = function(channelManager,socketManager,futureManager,objectPool,isSystem,systemBehaviour,sysId,sysIp){

		var actorId
		var systemId
		var systemIp
		var behaviour

		if(isSystem){
			behaviour 	= systemBehaviour
			actorId 	= sysId
			systemIp 	= sysIp
			systemId 	= sysId
		}

		var send 				= function(toId,message){
			//Destination is system actor
			if(toId == systemId){
				postMessage(message)
			}
			else{
				var channel 	= channelManager.getChannel(toId)
				channel.postMessage(message)
			}
		}

		var sendRemote 			= function(toAddress,toPort,message){
			if(socketManager.hasConnection(toAddress,toPort)){
				var socket = socketManager.getConnection(toAddress,toPort)
				socket.emit('message',{message: message})
			}
			else{
				socketManager.openConnection(toAddress,toPort,function(socket){
					socket.emit('message',{message: message})
				})
			}
		}

		//Called if the return value of a field access or method call is an object or a far reference
		var returnFarRef 		= function(object){
			if(serialiseModule.isProxy(object)){
				var farRef = serialiseModule.proxyToFarRef(object)
				return serialiseModule.serialise(farRef)
			}
			else{
				var oId 		= objectPool.newObject(object)
				var farRef 		= serialiseModule.makeFarRef(channelManager,futureManager,objectPool,actorId,actorId,oId,object)
				return serialiseModule.serialise(farRef)
			}
		}

		var returnRemoteFarRef = function(object){
			if(serialiseModule.isProxy(object)){
				//to change 
				var farRef = serialiseModule.proxyToFarRef(object)
				return serialiseModule.serialise(serialiseModule.farRefToRemote(farRef,socketManager,futureManager,objectPool,actorId))
			}
			else{
				var oId 		= obectPool.newObject(object)
				//Server object references have no address and port. These will be set to first contact actor on receiving side (i.e. the server)
				var farRef 		= serialiseModule.makeRemoteFarRef(socketManager,futureManager,objectPool,null,null,false,actorId,actorId,oId,object)
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
					console.log(err)
					console.log(property)
					ruined 		= true
					exception 	= err
				}
			}
			else{
				try{
					result = object[property]
				}
				catch(err){
					console.log(err.message)
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

		/////////////////////
		//system -> other  //
		/////////////////////

		var handleInit 			= function(initMsg){
			actorId 	= msgModule.initMsgActorId(initMsg)
			systemIp 	= msgModule.initMsgSystemIp(initMsg)
			systemId 	= msgModule.initMsgSystemId(initMsg)
			channelManager.initSystem(systemId)
			socketManager.systemIp = systemIp
			//console.log("Actor init with id: " + actorId)
		}

		var handleInject 		= function(injectMsg){
			behaviour 					= serialiseModule.parse(msgModule.injectActorBeh(injectMsg))
			objectPool.setBehaviour(behaviour)
			var systemBehaviour 		= serialiseModule.parse(msgModule.injectSystemBeh(injectMsg))
			//Inject standard library stuff in behaviour (e.g. system reference)
			var systemRef 				= serialiseModule.makeFarRef(channelManager,futureManager,objectPool,actorId,systemId,objectPool.behaviourId,systemBehaviour)
			behaviour.system 			= serialiseModule.generateProxy(systemRef)
			behaviour.getRemoteRef 		= function(address,port,actorName){
				var returnFut = futureManager.makeFuture()
				socketManager.openConnection(address,port,function(socket){
					var request 	 = msgModule.makeGetRemoteMsg(actorId,returnFut,true)
					//Actor server will resolve future with remote far reference to requested actor
					socket.emit('message',{message: request})
				})
				return returnFut
			}
			//allow actors to use futures "natively"
			behaviour.onRuin			= futureManager.onRuin
			behaviour.onResolve 		= futureManager.onResolve
			behaviour.isolate 			= serialiseModule.makeIsolate
			behaviour.selfRef 			= serialiseModule.generateProxy(serialiseModule.makeFarRef(channelManager,futureManager,objectPool,actorId,actorId,objectPool.behaviourId,behaviour))
			//Expect imports to be amd Modules
			if("imports" in behaviour){
				require(behaviour.imports,function(){
					for(var i in arguments){
						var exportedObject = arguments[i]
						for(var property in exportedObject){
							behaviour[property] = exportedObject[property]
						}
					}
					postMessage(msgModule.makeImportedMsg())
					if("init" in behaviour){
						behaviour.init()
					}
				})
			}
			else{
				postMessage(msgModule.makeImportedMsg())
				if("init" in behaviour){
					behaviour.init()
				}
			};
		}

		var handleChannelOpen 	= function(fullMsg,channelMsg){
			var otherActorId 			= msgModule.channelOpenMsgId(channelMsg)
			var channelPort	 			= fullMsg.ports[0]
			//If we receive a port to a new actor from system actor then that actor must have already been initialised
			//Name of the actor and it's behaviour do no matter since we cannot access these from spawned actors
			channelManager.newChannel(null,otherActorId,channelPort,null,true)
			channelPort.onmessage		= dispatcher
		}

		/////////////////////
		//any -> any       //
		/////////////////////

		var handleAccess 		= function(accessMsg){
			var fieldName 	= msgModule.accessMsgName(accessMsg)
			var future		= msgModule.accessMsgFuture(accessMsg)
			var fromId 		= msgModule.accessMsgActorId(accessMsg)
			var objectId 	= msgModule.accessMsgObjectId(accessMsg)
			var ruinHandler = function(exception){
				var ruinMsg 	= msgModule.makeRuinMsg(future,serialiseModule.serialise(exception))
				send(fromId,ruinMsg)
			}
			var returnHandler = function(result){
				if(serialiseModule.shouldFarRef(result)){
					result = returnFarRef(result)
				}
				var resolveMsg 	= msgModule.makeResolveMsg(future,result)
				send(fromId,resolveMsg)				
			}
			tryReturn(objectPool.getObject(objectId),fieldName,false,[],ruinHandler,returnHandler)
		}

		var handleCall 			= function(callMsg){
			var methodName	= msgModule.callMsgName(callMsg)
			var args 		= msgModule.callMsgArgs(callMsg)
			var fromId 		= msgModule.callMsgActorId(callMsg)
			var objectId 	= msgModule.callMsgObjectId(callMsg)
			var arguments 	= []
			//Check for serialised arguments
			for(i in args){
				var next = args[i]
				if(serialiseModule.isSerialisedFarRef(next)){
					//The serialised far reference still has a reference to the sender's channelManager so we need to recreate a new one for this actor (i.e. the receiving actor)
					var oldRef = serialiseModule.parse(next)
					var newRef = serialiseModule.renewFarRef(oldRef,channelManager,futureManager,objectPool,actorId)
					var proxy  = serialiseModule.generateProxy(newRef)
					arguments.push(proxy)
				}
				else if(serialiseModule.isSerialisedRemoteFarRef(next)){
					var oldRef = serialiseModule.parse(next)
					var newRef = serialiseModule.renewRemoteFarRef(oldRef,socketManager,futureManager,objectPool,actorId)
					var proxy  = serialiseModule.generateProxy(newRef)
					arguments.push(proxy)
				}
				else{
					//Objects are send by far reference so we know it is an isolate value
					arguments.push(next)
				}
			}
			var future 		= msgModule.callMsgFuture(callMsg)
			var ruinHandler = function(exception){
				var ruinMsg 	= msgModule.makeRuinMsg(future,serialiseModule.serialise(exception))
				send(fromId,ruinMsg)
			}
			var returnHandler = function(result){
				if(serialiseModule.shouldFarRef(result)){
					result = returnFarRef(result)
				}
				var resolveMsg 	= msgModule.makeResolveMsg(future,result)
				send(fromId,resolveMsg)				
			}
			tryReturn(objectPool.getObject(objectId),methodName,true,arguments,ruinHandler,returnHandler)
		}

		var handleResolve 		= function(resolveMsg){
			var future 	= msgModule.resolveMsgFuture(resolveMsg)
			var value 	= msgModule.resolveMsgVal(resolveMsg)
			if(serialiseModule.isSerialisedFarRef(value)){
				var oldRef 	= serialiseModule.parse(value)
				var newRef 	= serialiseModule.renewFarRef(oldRef,channelManager,futureManager,objectPool,actorId)
				var proxy 	= serialiseModule.generateProxy(newRef)
				value 		= proxy
			}
			else if(serialiseModule.isSerialisedRemoteFarRef(value)){
				var oldRef = serialiseModule.parse(value)
				var newRef = serialiseModule.renewRemoteFarRef(oldRef,socketManager,futureManager,objectPool,actorId)
				var proxy  = serialiseModule.generateProxy(newRef)
				value 	   = proxy
			}
			futureManager.resolve(future,value)
		}

		var handleRuin 			= function(ruinMsg){
			var future 		= msgModule.ruinMsgFuture(ruinMsg)
			var exception	= msgModule.ruinMsgException(ruinMsg)
			//If a remote call has been ruined the exception will already be parsed above
			if(typeof exception === 'string'){
				exception = serialiseModule.parse(exception)			
			}
			futureManager.ruin(future,exception)
		}

		var handleRemoteCall	= function(remoteCallMsg){
			var methodName 	= msgModule.remoteCallName(remoteCallMsg)
			var args 		= msgModule.remoteCallArgs(remoteCallMsg)
			var fromRef 	= msgModule.remoteCallFromRef(remoteCallMsg)
			var objectId 	= msgModule.remoteCallObjectId(remoteCallMsg)
			var future 		= msgModule.remoteCallFuture(remoteCallMsg)
			var arguments 	= []
			for(i in args){
				var next = args[i]
				if(serialiseModule.isSerialisedRemoteFarRef(next)){
					var oldRef = serialiseModule.parse(next)
					var newRef = serialiseModule.renewRemoteFarRef(oldRef,socketManager,futureManager,objectPool,actorId)
					var proxy  = serialiseModule.generateProxy(newRef)
					arguments.push(proxy)
				}
				else{
					arguments.push(next)
				}
			}
			var ruinHandler = function(exception){
				var ruinMsg 	= msgModule.makeRuinMsg(future,serialiseModule.serialise(exception))
				sendRemote(fromRef.address,fromRef.port,ruinMsg)
			}
			var returnHandler = function(result){
				if(serialiseModule.shouldFarRef(result)){
					result = returnRemoteFarRef(result)
				}
				var resolveMsg 	= msgModule.makeResolveMsg(future,result)
				sendRemote(fromRef.address,fromRef.port,resolveMsg)
			}
			tryReturn(objectPool.getObject(objectId),methodName,true,arguments,ruinHandler,returnHandler)	
		}

		var handleRemoteAccess 	= function(remoteAccessMsg){
			var fieldName 	= msgModule.remoteAccessName(remoteAccessMsg)
			var fromRef 	= msgModule.remoteAccessFromRef(remoteAccessMsg)
			var objectId 	= msgModule.remoteAccessObjectId(remoteAccessMsg)
			var future 		= msgModule.remoteAccessFuture(remoteAccessMsg)
			var ruinHandler = function(exception){
				var ruinMsg 	= msgModule.makeRuinMsg(future,serialiseModule.serialise(exception))
				sendRemote(fromRef.address,fromRef.port,ruinMsg)
			}
			var returnHandler = function(result){
				if(serialiseModule.shouldFarRef(result)){
					result = returnRemoteFarRef(result)
				}
				var resolveMsg 	= msgModule.makeResolveMsg(future,result)
				sendRemote(fromRef.address,fromRef.port,resolveMsg)				
			}
			tryReturn(objectPool.getObject(objectId),fieldName,false,[],ruinHandler,returnHandler)
		}

		var handlePeerRemoteAccess 	= function(peerRemoteAccessMsg){
			var fieldName 		= msgModule.peerRemoteAccessName(peerRemoteAccessMsg)
			var fromId 			= msgModule.peerRemoteAccessFromId(peerRemoteAccessMsg)
			var objectId 		= msgModule.peerRemoteAccessObjectId(peerRemoteAccessMsg)
			var future 			= msgModule.peerRemoteAccessFuture(peerRemoteAccessMsg)
			var routeAddress 	= msgModule.peerRemoteAccessRouteAdd(peerRemoteAccessMsg)
			var routePort 		= msgModule.peerRemoteAccessRoutePort(peerRemoteAccessMsg)
			var ruinHandler = function(exception){
				var ruinMsg 	= msgModule.makeRuinMsg(future,serialiseModule.serialise(exception))
				var routeMsg 	= msgModule.makeRouteMsg(actorId,null,fromId,ruinMsg)
				sendRemote(routeAddress,routePort,routeMsg)
			}
			var returnHandler = function(result){
				if(serialiseModule.shouldFarRef(result)){
					result = returnRemoteFarRef(result)
				}
				var resolveMsg 	= msgModule.makeResolveMsg(future,result)
				var routeMsg 	= msgModule.makeRouteMsg(actorId,null,fromId,resolveMsg)
				sendRemote(routeAddress,routePort,routeMsg)
			}
			tryReturn(objectPool.getObject(objectId),fieldName,false,[],ruinHandler,returnHandler)
		}

		var handlePeerRemoteCall 	= function(peerRemoteCallMsg){
			var methodName 		= msgModule.peerRemoteCallName(peerRemoteCallMsg)
			var args 			= msgModule.peerRemoteCallArgs(peerRemoteCallMsg)
			var fromId 			= msgModule.peerRemoteCallFromId(peerRemoteCallMsg)
			var objectId 		= msgModule.peerRemoteCallObjectId(peerRemoteCallMsg)
			var future 			= msgModule.peerRemoteCallFuture(peerRemoteCallMsg)
			var routeAddress 	= msgModule.peerRemoteCallRouteAdd(peerRemoteCallMsg)
			var routePort 		= msgModule.peerRemoteCallRoutePort(peerRemoteCallMsg)
			var arguments 		= []
			for(i in args){
				var next = args[i]
				if(serialiseModule.isSerialisedRemoteFarRef(next)){
					var oldRef = serialiseModule.parse(next)
					var newRef = serialiseModule.renewRemoteFarRef(oldRef,socketManager,futureManager,objectPool,actorId)
					var proxy  = serialiseModule.generateProxy(newRef)
					arguments.push(proxy)
				}
				else{
					arguments.push(next)
				}
			}
			//Since we know which server actor routed this message we can simply use the same router to ruin or resolve the future on the other peer
			var ruinHandler = function(exception){
				var ruinMsg 	= msgModule.makeRuinMsg(future,serialiseModule.serialise(exception))
				//toId doesn't matter since we send the route message directly to the right "to"
				var routeMsg 	= msgModule.makeRouteMsg(actorId,null,fromId,ruinMsg)
				//Send a new routing message to route ruin Msg 
				sendRemote(routeAddress,routePort,routeMsg)
			}
			var returnHandler = function(result){
				if(serialiseModule.shouldFarRef(result)){
					result = returnRemoteFarRef(result)
				}
				var resolveMsg 	= msgModule.makeResolveMsg(future,result)
				//Same routing mechanism here
				var routeMsg 	= msgModule.makeRouteMsg(actorId,null,fromId,resolveMsg)
				sendRemote(routeAddress,routePort,routeMsg)
			}
			tryReturn(objectPool.getObject(objectId),methodName,true,arguments,ruinHandler,returnHandler)
		}

		var dispatcher 			= function(rawMessage){
			if(msgModule.isInitMsg(rawMessage.data)){
				handleInit(rawMessage.data)
			}
			else if(msgModule.isInjectMsg(rawMessage.data)){
				handleInject(rawMessage.data)
			}
			else if(msgModule.isChannelOpenMsg(rawMessage.data)){
				handleChannelOpen(rawMessage,rawMessage.data)
			}
			else if(msgModule.isAccessMsg(rawMessage.data)){
				handleAccess(rawMessage.data)
			}
			else if(msgModule.isCallMsg(rawMessage.data)){
				handleCall(rawMessage.data)
			}
			else if(msgModule.isResolveMsg(rawMessage.data)){
				handleResolve(rawMessage.data)
			}
			else if(msgModule.isRuinMsg(rawMessage.data)){
				handleRuin(rawMessage.data)
			}
			else if(msgModule.isRemoteCallMsg(rawMessage.data)){
				handleRemoteCall(rawMessage.data)
			}
			else if(msgModule.isRemoteAccessMsg(rawMessage.data)){
				handleRemoteAccess(rawMessage.data)
			}
			else if(msgModule.isPeerRemoteCallMsg(rawMessage.data)){
				handlePeerRemoteCall(rawMessage.data)
			}
			else if(msgModule.isPeerRemoteAccessMsg(rawMessage.data)){
				handlePeerRemoteAccess(rawMessage.data)
			}
			else{
				throw {name: "UnknownMessage", message: "Webworker received unknown message: " ,toString:    function(){return this.name + ": " + this.message;}}
			}
		}

		return dispatcher
	}

	return{
		makeMessageHandler: makeMessageHandler
	}
})