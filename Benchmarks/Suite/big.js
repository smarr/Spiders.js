define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfActors,amountOfPings,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					//+1 for sink actor
					if(this.actorsInitialised == amountOfActors + 1){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								for(var i in actors){
									actors[i].pong()
								}
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

				end: function(){
					this.benchEnd()
				}

			}

			var actorBehaviour = {
				sinkRef: null,
				neighbours: [],
				pingsReceived: 0,
				pingsExpected: 0,

				neighbour: function(ref,sinkRef,totalAmount,totalPings){
					this.sinkRef = sinkRef
					this.pingsExpected = totalPings
					this.neighbours.push(ref)
					if(this.neighbours.length ==  totalAmount -1){
						this.system.actorInit()
					}
				},

				ping: function(sender){
					sender.pong()
				},

				pong: function(){
					if(this.pingsReceived == this.pingsExpected){
						this.sinkRef.exit()
					}
					else{
						this.pingsReceived += 1
						var targetIndex = Math.floor((Math.random() * this.neighbours.length));
						var target 		= this.neighbours[targetIndex]
						target.ping(this)
					}
				}

			}

			var sinkBehaviour = {
				totalNeighbours: 0,
				neighbours: [],
				exited: 0,

				neighbour: function(ref,totalAmount){
					this.totalNeighbours = totalAmount
					this.neighbours.push(ref)
					if(this.neighbours.length == totalAmount){
						this.system.actorInit()
					}
				},

				exit: function(){
					this.exited += 1
					if(this.exited == this.totalNeighbours){
						this.system.end()
					}
				}
			}


			systemActor(sysBehaviour)
			var sinkRef = actor(sinkBehaviour,"Sink")
			actors = []
			var count = amountOfActors
			while(count > 0){
				var newActor = actor(actorBehaviour)
				actors.push(newActor)
				count -= 1
			}
			for(var i in actors){
				var current = actors[i]
				sinkRef.neighbour(current,amountOfActors)
				for(var j in actors){
					var next = actors[j]
					if(i != j){
						current.neighbour(next,sinkRef,amountOfActors,amountOfPings)
					}
				}
			}
		},true)
	}

	return function(configs,startCB){
		var amActors 	= configs[0]
		var amPings 	= configs[1]
		construct(amActors,amPings,startCB)
	}
})