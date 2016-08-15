define(['./messages'], function(msgModule) {
	var functionPrefix  	= "_FUNCTION_"
	var errorPrefix 		= "_Error_"
	var farRefTypeTag 		= "_FarRef_"
	var remoteFarRefTypeTag = "_RemoteFarRef_" 
	var proxyTypeTag 		= "_PROXY_"
	var isolateTypeTag 		= "_ISOLATE_"
	var typeField 			= "_TYPE_"
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
		var scopeProxy = new Proxy({},{
						get: function(target,property){
							throw new ReferenceError("Property " + property + " not in actor scope")
						},
						//Make sure that "elemental" stuff can still be accessed
						has: function(target,property){
							return true && (property != "console") && (property != "Math") && (property != "setTimeout")
						}
		})
		return JSON.parse(objectRepresentation,function(key,val){
			if(toType(val) === "string"){
				if(val.search(functionPrefix) != -1){
					//!HACK! evalling the function "naked" would allow it to look up variables in this scope (e.g. msgModule would be visible)
					var functionSource = val.replace(functionPrefix,'')
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

	var isRemoteFarRef = function(object){
		return object[typeField] == remoteFarRefTypeTag
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

	//ContextId refers to the actor creating the far reference, while actorId refers the actor for which the far reference is created
	var makeFarRef = function(channelManager,futureManager,objectPool,contextId,actorId,objectId,targetObject){
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
			_TYPE_: 	farRefTypeTag,
			contextId: 	contextId,
			actorId: 	actorId,
			objectId: 	objectId,
			fields: 	fields,
			methods: 	methods,

			get: function(fieldName){
				var future 		= futureManager.makeFuture()
				var accessMsg 	= msgModule.makeAccessMsg(fieldName,contextId,objectId,future)
				channelManager.sendMessage(actorId,accessMsg)
				return future
			},

			call: function(methodName,args){
				var future  	= futureManager.makeFuture()
				var arguments 	= []
				for(i in args){
					var next = args[i]
					//One of the arguments might be a proxy, cast proxy to far reference
					if(isProxy(next)){
						arguments.push(serialise(proxyToFarRef(next)))
					}
					else if(shouldFarRef(next)){
						var oId 	= objectPool.newObject(next)
						var farRef 	= makeFarRef(channelManager,futureManager,objectPool,this.contextId,this.contextId,oId,next)
						arguments.push(serialise(farRef))
					}
					else{
						arguments.push(next)
					}
				}
				var callMsg 	= msgModule.makeCallMsg(methodName,arguments,contextId,objectId,future)
				channelManager.sendMessage(actorId,callMsg)
				return future
			}
		}
	}

	//Called when a far reference has been serialised and sent to another actor
	var renewFarRef = function(oldRef,newChannelManager,newFutureManager,objectPool,newContextId){
		//Re-create a new target object out of the fields and methods contained in old far reference
		var targetObject = {}
		for(var i in oldRef.fields){
			//Actual value doesn't matter since it will be proxied
			targetObject[oldRef.fields[i]] = null
		}
		for(var i in oldRef.methods){
			targetObject[oldRef.methods[i]] = function(){}
		}
		return makeFarRef(newChannelManager,newFutureManager,objectPool,newContextId,oldRef.actorId,oldRef.objectId,targetObject)
	}

	var makeRemoteFarRef = function(socketManager,futureManager,objectPool,address,port,serverObject,contextId,actorId,objectId,targetObject,FCId){
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
			contextId: 	contextId,
			actorId: 	actorId,
			FCId: 		FCId,
			objectId: 	objectId,
			fields: 	fields,
			methods: 	methods,

			//Implements remote ref routing protocol
			send: function(message){
				//Whether it's a remote ref to server or browser object, browsers always need to send remote message to address and port contained in ref
				//Which message to send (i.e. regular or route depends on type of object)
				if(!this.isServerOb){
					message = msgModule.makeRouteMsg(this.contextId,this.FCId,this.actorId,message)
				}
				if(socketManager.hasConnection(this.address,this.port)){
					var socket 	= socketManager.getConnection(this.address,this.port)
					socket.emit('message',{message: message})					
				}
				else{
					socketManager.openConnection(this.address,this.port,function(socket){
						socket.emit('message',{message: message})
					})						
				}	
			},

			get: function(fieldName){
				//TODO change in similar fashion to how call is implemented now (after calling and resolving test pass)
				var future 		= futureManager.makeFuture()
				this.send(msgModule.makeBrowserRemoteAccessMsg(fieldName,this.contextId,this.objectId,future))
				return future
			},

			call: function(methodName,args){
				var future  	= futureManager.makeFuture()
				var arguments 	= []
				for(i in args){
					var next = args[i]
					//One of the arguments might be a proxy, cast proxy to far reference
					if(isProxy(next)){
						var farRef = proxyToFarRef(next)
						arguments.push(serialise(renewRemoteFarRef(farRef, socketManager,futureManager,objectPool,contextId)))
					}
					else if(shouldFarRef(next)){
						var oId 	= objectPool.newObject(next)
						var farRef 	= makeRemoteFarRef(socketManager,futureManager,objectPool,null,null,false,contextId,contextId,oId,next)
						arguments.push(serialise(farRef))
					}
					else{
						arguments.push(next)
					}
				}
				var callMsg
				if(this.isServerOb){
					callMsg 	= msgModule.makeBrowserRemoteCallMsg(methodName,arguments,this.contextId,this.objectId,future)
				}
				else{
					callMsg 	= msgModule.makePeerRemoteCallMsg(methodName,arguments,this.contextId,this.objectId,future)
				}
				this.send(callMsg)
				return future
			}
		}
	}

	var renewRemoteFarRef = function(oldRef,socketManager,futureManager,objectPool,contextId){
		//Re-create a new target object out of the fields and methods contained in old far reference
		var targetObject = {}
		for(var i in oldRef.fields){
			//Actual value doesn't matter since it will be proxied
			targetObject[oldRef.fields[i]] = null
		}
		for(var i in oldRef.methods){
			targetObject[oldRef.methods[i]] = function(){}
		}
		return makeRemoteFarRef(socketManager,futureManager,objectPool,oldRef.address,oldRef.port,oldRef.isServerOb,contextId,oldRef.actorId,oldRef.objectId,targetObject,oldRef.FCId)
	}

	var farRefToRemote = function(oldRef,socketManager,futureManager,objectPool,contextId){
		var targetObject = {}
		for(var i in oldRef.fields){
			targetObject[oldRef.fields[i]] = null
		}
		for(var i in oldRef.methods){
			targetObject[oldRef.methods[i]] = function(){}
		}
		return makeRemoteFarRef(socketManager,futureManager,objectPool,null,null,false,contextId,oldRef.actorId,oldRef.objectId,targetObject,null)
	}



  	return {
  		serialise: 					serialise,
  		parse: 						parse,
  		isFarRef: 					isFarRef,
  		isRemoteFarRef: 			isRemoteFarRef,
  		isSerialisedFarRef: 		isSerialisedFarRef,
  		isSerialisedRemoteFarRef: 	isSerialisedRemoteFarRef,
  		shouldFarRef: 				shouldFarRef,
  		makeFarRef: 				makeFarRef,
  		renewFarRef: 				renewFarRef,
  		makeRemoteFarRef: 			makeRemoteFarRef,
  		renewRemoteFarRef: 			renewRemoteFarRef,
  		generateProxy: 				generateProxy,
  		makeIsolate: 				makeIsolate,
  		isProxy: 					isProxy,
  		proxyToFarRef: 				proxyToFarRef,
  		farRefToRemote: 			farRefToRemote,
  	};
});