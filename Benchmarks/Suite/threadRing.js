define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfActors,amountOfPings,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsDone: 		0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == amountOfActors){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								var pingMessage 	= that.isolate({
									pingsLeft: amountOfPings
								})
								actors[0].ping(pingMessage)
							},
							function(){
								killAll()
							}
						)
					}
				},

				actorInit: function(){
					this.actorsInitialised += 1
					this.checkConfig()
				},

				traversalDone: function(){
					this.benchEnd()
				}
			}

			var actorBehaviour = {
				allNeighbours: 	null,
				myNeighbour: 	null,

				ping: function(pingMessage){
					if(pingMessage.pingsLeft > 0){
						pingMessage.pingsLeft = pingMessage.pingsLeft - 1
						this.myNeighbour.ping(pingMessage)
					}
					else{
						var stopMessage = this.isolate({
							stopsLeft: this.allNeighbours
						})
						this.myNeighbour.stop(stopMessage)
					}
				},

				stop: function(stopMessage){
					if(stopMessage.stopsLeft > 0){
						stopMessage.stopsLeft = stopMessage.stopsLeft - 1
						this.myNeighbour.stop(stopMessage)
					}
					else{
						this.system.traversalDone()
					}
				},

				neighbour: function(ref,totalActors){
					this.myNeighbour 	= ref
					this.allNeighbours 	= totalActors
					this.system.actorInit()
				}
			}


			systemActor(sysBehaviour)
			actors = []
			var count = amountOfActors
			while(count > 0){
				var newActor = actor(actorBehaviour)
				actors.push(newActor)
				count -= 1
			}
			var index = 0
			for(var i in actors){
				var next = actors[i]
				var neighbour = (index + 1) % amountOfActors
				next.neighbour(actors[neighbour],amountOfActors)
				index += 1
			}
		},true)
	}

	return function(configs,startCB){
		var amActors 	= configs[0]
		var amPings 	= configs[1]
		construct(amActors,amPings,startCB)
	}
})