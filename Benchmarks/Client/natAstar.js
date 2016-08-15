define(function(){
	var construct 	 = function(numWorkers,threshold,gridSize,configCallback){
		var actorsInitialised = 	0
		var actorsExited = 		0
		var benchEnd = 			null
		var totalEnded = 		0

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == 1 + numWorkers){
					configCallback(
						function(be){
							benchEnd 		= be
							masterRef.postMessage(["start"])
						},
						function(){
							masterRef.terminate()
							for(var i in allWorkers){
								allWorkers[i].terminate()
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
					console.log("Unknown message (System): " + event.data[0])
			}
		}
		var masterRef = new Worker('./natAstarMaster.js')
		masterRef.onmessage = sysHandle
		masterRef.postMessage(["config",numWorkers,gridSize])
		var id = 0
		var allWorkers = []
		for(var i = 0;i < numWorkers;i++){
			var workerRef = new Worker('./natAstarWorker.js')
			allWorkers.push(workerRef)
			workerRef.onmessage = sysHandle
			var chan = new MessageChannel()
			masterRef.postMessage(["addWorker",id],[chan.port2])
			workerRef.postMessage(["config",threshold,gridSize],[chan.port1])
			id += 1
		}	
		masterRef.postMessage(["configDone"])
	}

	return function(configs,startCB){
		var numWorkers	= configs[0]
		var threshold 	= configs[1]
		var gridSize 	= configs[2]
		construct(numWorkers,threshold,gridSize,startCB)
	}
})