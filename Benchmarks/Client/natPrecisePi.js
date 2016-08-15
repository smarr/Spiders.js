define(function(){
	var construct 	 = function(workers,precision,configCallback){
		var actorsInitialised = 	0
		var actorsExited = 		0
		var benchEnd = 			null
		var totalEnded = 		0

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == workers + 1){
					configCallback(
						function(be){
							benchEnd 		= be
							masterRef.postMessage(["start"])
						},
						function(){
							masterRef.terminate()
							for(var i in workerRefs){
								workerRefs[i].terminate()
							}
						}
					)
				}
			}

			function actorInit(){
				actorsInitialised += 1
				checkConfig()
			}

			function actorExit(){
				actorsExited += 1
				if(actorsExited == (workers + 1)){
					benchEnd()
				}
			}

			function end(){
				benchEnd()
			}

			switch(event.data[0]){
				case "actorInit":
					actorInit()
					break;
				case "actorExit":
					actorExit()
					break;
				case "end":
					end()
					break;
				default :
					console.log("Unknown message (System): " + event.data[0])
			}
		}

		var masterRef = new Worker('./natPrecisePiMaster.js')
		masterRef.onmessage = sysHandle
		masterRef.postMessage(["config",workers,precision])
		var id = 0
		var workerRefs = []
		for(var i = 0;i < workers;i++){
			var workerRef = new Worker('./natPrecisePiWorker.js')
			workerRefs.push(workerRef)
			workerRef.onmessage = sysHandle
			var chan = new MessageChannel()
			masterRef.postMessage(["newWorker",id],[chan.port1])
			workerRef.postMessage(["config",id],[chan.port2])
			id += 1
		}
		masterRef.postMessage(["configDone"])
	}

	return function(configs,startCB){
		var workers 	= configs[0]
		var precision 	= configs[1]
		construct(workers,precision,startCB)
	}
})