define(function(){
	var construct 	 = function(amountOfActors,amountOfMeetings,configCallback){
		var actorsInitialised = 	0
		var meetingsToHold =	amountOfMeetings
		var numFaded = 			0
		var sumMeetings = 		0
		var waitingCham =		null
		var benchEnd = 			null

		function sysHandler(event){
			function checkConfig(){
				if(actorsInitialised == amountOfActors){
					configCallback(
						function(be){
							benchEnd 		= be
							for(var i in actors){
								actors[i].postMessage(["startGame"])
							}
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

			function meetCount(count){
				numFaded += 1
				sumMeetings = sumMeetings + count
				if(numFaded == amountOfActors){
					benchEnd()
				}
			}

			function meet(sender,color){
				if(meetingsToHold > 0){
					if(waitingCham == null){
						waitingCham = sender
					}
					else{
						meetingsToHold -= 1
						waitingCham.postMessage(["meet",color],[sender])
						waitingCham = null
					}
				}
				else{
					sender.postMessage(["exitGame"])
				}
			}

			switch(event.data[0]){
				case "actorInit":
					actorInit()
					break;
				case "meetCount":
					meetCount(event.data[1])
					break;
				case "meet":
					meet(event.ports[0],event.data[1])
					break;
				default :
					console.log("Unknown message: " + event.data[0])
			}	
		}

		var actors = []
		var count = amountOfActors
		while(count > 0){
			var newActor = new Worker('./natChameneoActor.js')
			newActor.onmessage = sysHandler
			actors.push(newActor)
			count -= 1
		}
		for(var i in actors){
			var next = actors[i]
			next.postMessage(["config",(i % 3)])
		}
	}

	return function(configs,startCB){
		var amActors 	= configs[0]
		var amMeetings 	= configs[1]
		construct(amActors,amMeetings,startCB)
	}
})