define(function(){
	var construct 	 = function(amountOfActors,amountOfMessages,amountOfWrite,amountOfSize,configCallback){
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
							listRef.terminate()
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

		var masterRef = new Worker('./natCLinkedListMaster.js')
		masterRef.onmessage = sysHandler
		masterRef.postMessage(["config",amountOfActors])
		var listRef = new Worker('./natCLinkedListList.js')
		listRef.onmessage = sysHandler
		var actors = []
		var count = amountOfActors
		while(count > 0){
			var newActor = new Worker('./natCLinkedListWorker.js')
			newActor.onmessage = sysHandler
			actors.push(newActor)
			var masChan = new MessageChannel()
			masterRef.postMessage(["link"],[masChan.port2])
			var lisChan = new MessageChannel()
			listRef.postMessage(["link"],[lisChan.port2])
			newActor.postMessage(["linkMaster"],[masChan.port1])
			newActor.postMessage(["linkList"],[lisChan.port1])
			newActor.postMessage(["config",amountOfWrite,amountOfSize,amountOfMessages])
			count -= 1
		}
	}

	return function(configs,startCB){
		var amActors 	= configs[0]
		var amMsg 		= configs[1]
		var amWrite 	= configs[2]
		var amSize 		= configs[3]
		construct(amActors,amMsg,amWrite,amSize,startCB)
	}
})