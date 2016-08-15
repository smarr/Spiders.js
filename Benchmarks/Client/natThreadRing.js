define(function(){
	var construct 	 = function(amountOfActors,amountOfPings,configCallback){
		var actorsInitialised = 	0
		var actorsDone =		0
		var benchEnd =			null

		function sysHandler(event){
			function checkConfig(){
				if(actorsInitialised == amountOfActors){
					configCallback(
						function(be){
							benchEnd 		= be
							actors[0].postMessage(["ping",amountOfPings])
						},
						function(){
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

			function traversalDone(){
				benchEnd()
			}

			switch(event.data[0]){
				case "actorInit":
					actorInit()
					break;
				case "traversalDone":
					traversalDone()
					break;
			}
		}

		var actors = []
		var count = amountOfActors
		while(count > 0){
			var newActor = new Worker('./natThreadRingActor.js')
			newActor.onmessage = sysHandler
			actors.push(newActor)
			count -= 1
		}
		var index = 0
		for(var i in actors){
			var next = actors[i]
			var neighbour = (index + 1) % amountOfActors
			var chan = new MessageChannel()
			next.postMessage(["neighbour",amountOfActors],[chan.port1])
			actors[neighbour].postMessage(["newLink"],[chan.port2])
			index += 1
		}
	}

	return function(configs,startCB){
		var amActors 	= configs[0]
		var amPings 	= configs[1]
		construct(amActors,amPings,startCB)
	}
})