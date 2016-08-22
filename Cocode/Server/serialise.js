////////////////////////
//Serialise Module    //
///////////////////////
var msgModule = require('./messages')

var functionPrefix  	= "_FUNCTION_"
var errorPrefix 		= "_Error_"
var farRefTypeTag 		= "_FarRef_"
var remoteFarRefTypeTag = "_RemoteFarRef_" 
var proxyTypeTag 		= "_PROXY_"
var typeField 			= "_TYPE_"
var isolateTypeTag 		= "_ISOLATE_"
//Enables to detect true type of instances (e.g. array)
var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

//Obects and functions are only serialised upon spawning a new actor
//Return a function or an object as part of an async call is done by creating a far reference and return this reference in other cases 
var serialise = function(object){
	return JSON.stringify(object, function(key, val) {
	  if (toType(val) === 'function') {
	    return functionPrefix + val.toString();
	  }
	  else if(toType(val) === 'error'){
	  	var errorMessage = val.message
	  	var errorName 	 = val.name
	  	return errorPrefix + '{"message":' + '"' +  errorMessage + '"' + ',"name":' + '"' +  errorName + '"' + '}'
	  }
	  else{
	  	return val;
	  }
	});
}

var parse = function(objectRepresentation){
	return JSON.parse(objectRepresentation,function(key,val){
		if(toType(val) === 'string'){
			if(val.search(functionPrefix) != -1){
				//!HACK! evalling the function "naked" would allow it to look up variables in this scope (e.g. futModule would be visible)
				var functionSource = val.replace(functionPrefix,'')
				var scopeProxy = new Proxy({},{
					get: function(target,property){
						throw new ReferenceError("Property " + property + " not in actor scope")
					},
					//Make sure that "elemental" stuff can still be accessed
					has: function(target,property){
						return true && (property != "console")
					}
				})
				return eval("with(scopeProxy){(" + functionSource + ")}")
			}
			else if(val.search(errorPrefix) != -1){
				var errorSource = val.replace(errorPrefix,'')
				//Is a "regular" object, need to create an actual error object out of it
				var object 		= JSON.parse(errorSource)
				return eval("new " + object.name + "(" + '"' +  object.message + '"' + ")")
			}
			else{
				return val
			}
		}
		else{
			return val
		}
	})
}

var isFarRef = function(object){
	return object[typeField] == farRefTypeTag
}

var makeIsolate = function(object){
	object[typeField] = isolateTypeTag
	return object
}

var isIsolate = function(object){
	return object[typeField] == isolateTypeTag
}

var isSerialisedFarRef = function(objectRepresentation){
	if(typeof objectRepresentation === "string"){
		return objectRepresentation.search(farRefTypeTag) != -1			
	}
	else{
		return false
	}
}

var isSerialisedRemoteFarRef = function(objectRepresentation){
	if(typeof objectRepresentation === "string"){
		return objectRepresentation.search(remoteFarRefTypeTag) != -1
	}
	else{
		return false
	}
}

//Check if function return value should be turned into far reference
var shouldFarRef = function(element){
	var type = toType(element)
	//TODO, what about arrays ?
	return type === "object" && !(isIsolate(element))
}

var isProxy 	  = function(object){
	return object[typeField] == proxyTypeTag
}

var proxyToFarRef = function(proxy){
	return proxy["_castToRef_"]
}

var generateProxy = function(farRef){
	var fieldTag  = "_FIELD_"
	var farObject = {}
	for(var i in farRef.fields){
		farObject[farRef.fields[i]] = fieldTag
	}
	//We need to trap function application in the proxied object, each method must be a proxy on its own
	for(var i in farRef.methods){
		function generateFunctionProxy(index){
			var methodName = farRef.methods[index]
			farObject[methodName] = new Proxy(function() {}, {
				apply: function(target, thisArg, argumentsList) {
					return farRef.call(methodName,argumentsList)
				 }
			})
		}
		generateFunctionProxy(i)
	}
	return new Proxy(farObject,{
		get: function(target, property) {
		    if (property in target) {
		    	//If the accessed property is a field immediatly return the future resulting from a .get on FarRef
		    	//Otherwise simply return the proxied function object created above
		    	//If the target holds a string for the property it must be a field (ugly but needed since we would otherwise implicitly cast target[property] to string which raises error if function proxy)
		    	if(typeof target[property] == "string"){
		    		return farRef.get(property)
		    	}
		    	else{
		    		//This will be a proxied method
		    		return target[property]
		    	}
		    } else {
		    	//Check for special messages send to proxy objects
		    	if(property == typeField){
		    		return proxyTypeTag
		    	}
		    	else if (property == "_castToRef_"){
		    		return farRef
		    	}
		    	else{
		        	throw new ReferenceError("Far reference doesn't understand: " + property)
		    	}
		    }
		}
	})
}


var makeRemoteFarRef = function(socketManager,futureManager,objectPool,address,port,serverObject,contextRef,actorId,objectId,targetObject,FCId){
	var fields 	= []
	var methods = []

	for(var property in targetObject){
		if(targetObject.hasOwnProperty(property)){
			if(typeof targetObject[property] == 'function'){
				methods.push(property)
			}
			else{
				fields.push(property)
			}
		}
	}

	return {
		_TYPE_: 	remoteFarRefTypeTag,
		isServerOb: serverObject,
		address: 	address,
		port: 		port, 
		contextRef: contextRef,
		actorId: 	actorId,
		objectId: 	objectId,
		FCId: 		FCId,
		fields: 	fields,
		methods: 	methods,

		//Implements remote ref routing protocol
		send: function(message){
			if(this.isServerOb){
				if(socketManager.hasConnection(this.actorId)){
					var connection 	= socketManager.getConnection(this.actorId)
					connection.emit('message',{message: message})					
				}
				else{
					//Are we opening socket to actor residing on same machine?
					if(this.address == socketManager.systemIp){
						socketManager.openConnection(this.address,this.port,this.actorId,function(connection){
							connection.emit('message',{message: message})
						},true)
					}
					else{
						socketManager.openConnection(this.address,this.port,this.actorId,function(connection){
							connection.emit('message',{message: message})
						},false)					
					}
					
				}
			}
			else{
				//If I have a connection to the actor then send a routing message directly, otherwise route the message to the first contact server actor
				if(socketManager.hasBrowserConnection(this.actorId)){
					var socket = socketManager.getBrowserConnection(this.actorId)
					socket.emit('message',{message: message})
				}
				else{
					var fromId 	= this.contextRef.actorId
					var toId 	= this.FCId
					var msg 	= msgModule.makeRouteMsg(fromId,toId,this.actorId,message)
					//Check if I have a connection to the first contact server actor
					if(socketManager.hasConnection(this.FCId)){
						var socket 	= socketManager.getConnection(this.FCId)
						socket.emit('message',{message: msg})
					}
					else{
						socketManager.openConnection(this.address,this.port,this.FCId,function(socket){
							socket.emit('message',{message: msg})
						})
					}
				}
			}	
		},

		get: function(fieldName){
			var future 		= futureManager.makeFuture()
 			this.send(msgModule.makeRemoteAccessMsg(fieldName,this.contextRef,this.objectId,future))
			return future
		},

		call: function(methodName,args){
			var future  	= futureManager.makeFuture()
			var arguments 	= []
			for(i in args){
				var next = args[i]
				if(isProxy(next)){
					var farRef = proxyToFarRef(next)
					arguments.push(serialise(renewRemoteFarRef(farRef, socketManager,futureManager,objectPool,this.contextRef)))
				}
				else if(shouldFarRef(next)){
					var oId 	= objectPool.newObject(next)
					var farRef 	= makeRemoteFarRef(socketManager,futureManager,objectPool,this.contextRef.address,this.contextRef.port,true,contextRef,this.contextRef.actorId,oId,next,null)
					arguments.push(serialise(farRef))
				}
				else{
					arguments.push(next)
				}
			}
			var callMsg 	= msgModule.makeRemoteCallMsg(methodName,arguments,this.contextRef,this.objectId,future)
			this.send(callMsg)
			return future
		}
	}
}

//Actor received a remote far reference (as argument to function call or as resolve of future). Replace the socket and future manager to reference to the ones employed by receiving actor
var renewRemoteFarRef = function(farRef,socketManager,futureManager,objectPool,contextRef){
	var targetObject = {}
	for(var i in farRef.fields){
		//Actual value doesn't matter since it will be proxied
		targetObject[farRef.fields[i]] = null
	}
	for(var i in farRef.methods){
		targetObject[farRef.methods[i]] = function(){}
	}
	return makeRemoteFarRef(socketManager,futureManager,objectPool,farRef.address,farRef.port,farRef.isServerOb,contextRef,farRef.actorId,farRef.objectId,targetObject,farRef.FCId)
}

var makeFCRemoteFarRef = function(farRef,socketManager,futureManager,objectPool,contextRef){
	var plainRemoteRef 		= renewRemoteFarRef(farRef,socketManager,futureManager,objectPool,contextRef)
	plainRemoteRef.address 	= contextRef.address
	plainRemoteRef.port 	= contextRef.port
	plainRemoteRef.FCId 	= contextRef.actorId
	return plainRemoteRef
}

exports.serialise 					= serialise
exports.parse 						= parse
exports.isSerialisedFarRef 			= isSerialisedFarRef
exports.isSerialisedRemoteFarRef 	= isSerialisedRemoteFarRef
exports.shouldFarRef				= shouldFarRef
exports.makeRemoteFarRef  			= makeRemoteFarRef
exports.renewRemoteFarRef  			= renewRemoteFarRef
exports.makeFCRemoteFarRef 			= makeFCRemoteFarRef
exports.generateProxy  				= generateProxy
exports.isProxy 					= isProxy
exports.proxyToFarRef 				= proxyToFarRef
exports.makeIsolate 				= makeIsolate
exports.isIsolate 					= isIsolate