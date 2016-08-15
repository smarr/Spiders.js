define(function(){
	var construct 	 = function(amountOfActors,amountOfMessages,amountOfWrite,configCallback){
		var actorsInitialised = 	0
		var benchEnd =			null
		function sysHandler(event){
			function checkConfig(){
				if(actorsInitialised == amountOfActors + 2){
					configCallback(
						function(be){
							benchEnd 		= be
							for(var i in actors){
								actors[i].postMessage(["work"])
							}
						},
						function(){
							masterRef.terminate()
							dictRef.terminate()
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
			}
		}

		var masterRef = new Worker('./natCDictMaster.js')
		masterRef.onmessage = sysHandler
		masterRef.postMessage(["config",amountOfActors])
		var dictRef = new Worker('./natCDictDict.js')
		dictRef.onmessage = sysHandler
		var actors = []
		var count = amountOfActors
		while(count > 0){
			var newActor = new Worker('./natCDictWorker.js')
			newActor.onmessage = sysHandler
			actors.push(newActor)
			var masChan = new MessageChannel()
			var dictChan = new MessageChannel()
			masterRef.postMessage(["link"],[masChan.port2])
			dictRef.postMessage(["link"],[dictChan.port2])
			newActor.postMessage(["linkMaster"],[masChan.port1])
			newActor.postMessage(["linkDict"],[dictChan.port1])
			newActor.postMessage(["config",amountOfWrite,amountOfMessages])
			count -= 1
		}
	}

	return function(configs,startCB){
		var amActors 	= configs[0]
		var amMsg 		= configs[1]
		var amWrite 	= configs[2]
		construct(amActors,amMsg,amWrite,startCB)
	}
})