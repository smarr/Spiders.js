define(function() {

	
	//Make sure that each actor importing this script has it's own instance of it
	var makeManager = function(){
		return {
			iniatedActors: 	 	[],

			actorMap: 		 	{},

			nameMap: 			{},

			behaviourMap: 		{},

			messageBuffer: 	 	{},

			systemId: 			0,

			reset: 				function(){
				this.nameMap 		= {}
				this.behaviourMap 	= {}
				this.messageBuffer 	= {}
			},

			newChannel: 		function(actorName,actorId,actorChannel,actorBehaviour,initialised){
				this.actorMap[actorId]  	= actorChannel
				this.behaviourMap[actorId] 	= actorBehaviour
				this.nameMap[actorName] 	= actorId
				if(initialised){
					this.actorInitiated(actorId)
				}
			},

			hasNamedActor: 		function(actorName){
				return actorName in this.nameMap
			},

			actorInitiated:		function(actorId){
				this.iniatedActors.push(actorId)
				this.flushMessages(actorId)
			},

			isInitiated: 	 	function(actorId){
				return this.iniatedActors.indexOf(actorId) != -1
			},

			getChannel: 		function(actorId){
				return this.actorMap[actorId]
			},

			getActorId: 		function(actorName){
				return this.nameMap[actorName]
			},

			getActorBehaviour: 	function(actorId){
				return this.behaviourMap[actorId]
			},

			bufferMessage: 		function(actorId,message){
				if(actorId in this.messageBuffer){
					(this.messageBuffer[actorId]).push(message)
				}
				else{
					this.messageBuffer[actorId] = [message]
				}
			},

			flushMessages: 		function(actorId){
				if(actorId in this.messageBuffer){
					var messages = this.messageBuffer[actorId]
					for(var i in messages){
						var nextMessage = messages[i]
						//console.log("Flushing message: " + nextMessage.name + " for actor : " + actorId + " in actor: " + this.systemId)
						this.sendMessage(actorId,nextMessage)
					}
				}
			},

			sendMessage: 		function(actorId,message){
				//console.log("Sending message: " + message.name + " to actor with id: " + actorId +   " in actor: " + this.systemId)
				if(actorId == this.systemId){
					postMessage(message)
				}
				else{
					if(this.isInitiated(actorId)){
						var channel = this.getChannel(actorId)
						try {channel.postMessage(message)}
						catch(err){
							console.log(err.message)
							console.log(message.tag)
							console.log(message.name)
						}
					}
					else{
						//console.log("Actor wasn't init for message: " + message.name + " for actor with id: " + actorId + " in actor: " + this.systemId)
						this.bufferMessage(actorId,message)
					}
				}
			},

			initSystem: 		function(systemId){
				this.systemId = systemId
			}
		}
	}

	

	return {
		makeManager: makeManager
	}
})