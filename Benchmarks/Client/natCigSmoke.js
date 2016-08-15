define(function(){
	var construct 	 = function(amountOfRounds,amountOfSmokers,configCallback){
		var actorsInitialised = 	0
		var benchEnd = 			null

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == amountOfSmokers +  1){
					configCallback(
						function(be){
							benchEnd 		= be
							arbiterRef.postMessage(["pickRandom"])
						},
						function(){
							arbiterRef.terminate()
							for(var i in smokers){
								smokers[i].terminate()
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

		var arbiterRef = new Worker('./natCigSmokeArbiter.js')
		arbiterRef.onmessage = sysHandle
		arbiterRef.postMessage(["config",amountOfRounds,amountOfSmokers])
		var smokCount 	= amountOfSmokers - 1
		var smokers = []
		while(smokCount >= 0){
			var newSmok = new Worker('./natCigSmokeSmoker.js')
			newSmok.onmessage = sysHandle
			var chan = new MessageChannel()
			newSmok.postMessage(["config"],[chan.port1])
			arbiterRef.postMessage(["newSmoker"],[chan.port2])
			smokers.push(newSmok)
			smokCount -= 1
		}
	}

	return function(configs,startCB){
		var amRounds 	= configs[0]
		var amSmokers 	= configs[1]
		construct(amRounds,amSmokers,startCB)
	}
})