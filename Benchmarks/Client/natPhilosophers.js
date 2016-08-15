define(function(){
	var construct 	 = function(amountOfPhilosophers,amountOfEatRounds,configCallback){
		var actorsInitialised = 	0
		var benchEnd = 			null

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == amountOfPhilosophers + 1){
					configCallback(
						function(be){
							benchEnd 		= be
							for(var i in philosophers){
								philosophers[i].postMessage(["start"])
							}
						},
						function(){
							waiterRef.terminate()
							for(var i in philosophers){
								philosophers[i].terminate()
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

		var waiterRef = new Worker('./natPhilosopherWaiter.js')
		waiterRef.onmessage = sysHandle
		waiterRef.postMessage(["config",amountOfPhilosophers])
		var philosophers = []
		var philCount = amountOfPhilosophers - 1
		while(philCount >= 0){
			var newPhil = new Worker('./natPhilosopherPhilosopher.js')
			newPhil.onmessage = sysHandle
			var chan = new MessageChannel()
			waiterRef.postMessage(["link"],[chan.port2])
			newPhil.postMessage(["config",philCount,amountOfEatRounds],[chan.port1])
			philosophers.push(newPhil)
			philCount -= 1
		}
	}

	return function(configs,startCB){
		var amPhilo 	= configs[0]
		var amEat 		= configs[1]
		construct(amPhilo,amEat,startCB)
	}
})