define(function(){
	var construct 	 = function(amountOfActors,amountOfPings,configCallback){
		var actorsInitialised = 	0
		var benchEnd = 			null

		function sysHandler(event){
			function checkConfig(){
				if(actorsInitialised == amountOfActors + 1){
					configCallback(
						function(be){
							benchEnd 		= be
							for(var i in actors){
								actors[i].postMessage(["pong"])
							}
						},
						function(){
							sinkRef.terminate()
							for(var i in actors){
								actors[i].terminate()
							}
						}
					)
				}
			}

			function actorInit(){
				actorsInitialised += 1
				checkConfig()
			}

			function end(){
				benchEnd()
			}

			switch(event.data[0]){
				case "actorInit":
					actorInit()
					break;
				case "end":
					end()
					break;
				default :
					console.log("Unknown message: " + event.data[0])
			}
		}

		var sinkRef = new Worker('./natBigSink.js')
		sinkRef.onmessage = sysHandler
		var actors = []
		var count = amountOfActors
		while(count > 0){
			var newActor = new Worker('./natBigActor.js')
			newActor.onmessage = sysHandler
			actors.push(newActor)
			count -= 1
		}
		for(var i in actors){
			var sinkChan = new MessageChannel()
			var current = actors[i]
			current.postMessage(["setSink"],[sinkChan.port1])
			sinkRef.postMessage(["neighbour",amountOfActors],[sinkChan.port2])
			for(var j in actors){
				var next = actors[j]
				var nextChan = new MessageChannel()
				if(i != j){
					current.postMessage(["neighbour",amountOfActors,amountOfPings],[nextChan.port1])
					next.postMessage(["link"],[nextChan.port2])
				}
			}
		}
	}

	return function(configs,startCB){
		var amActors 	= configs[0]
		var amPings 	= configs[1]
		construct(amActors,amPings,startCB)
	}
})