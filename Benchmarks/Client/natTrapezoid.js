define(function(){
	var construct 	 = function(pieces,workers,left,right,configCallback){
		var actorsInitialised = 	0
		var actorsExited = 		0
		var benchEnd =			null
		var totalSpawned = 		2
		var totalEnded =		0

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == workers + 1){
					configCallback(
						function(be){
							benchEnd 		= be
							masterRef.postMessage(["work"])
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

		var masterRef = new Worker('./natTrapezoidMaster.js')
		masterRef.onmessage = sysHandle
		var precision = (right - left) / pieces
		masterRef.postMessage(["config",left,right,precision])
		var id = 0
		var workerRefs = []
		for(var i = 0;i < workers;i++){
			var workerRef = new Worker('./natTrapezoidWorker.js')
			workerRefs.push(workerRef)
			workerRef.onmessage = sysHandle
			var chan = new MessageChannel()
			masterRef.postMessage(["newWorker"],[chan.port2])
			workerRef.postMessage(["config",id],[chan.port1])
			id += 1
		}
		masterRef.postMessage(["configDone"])
	}

	return function(configs,startCB){
		var pieces 		= configs[0]
		var workers 	= configs[1]
		var left 		= configs[2]
		var right 		= configs[3]
		construct(pieces,workers,left,right,startCB)
	}
})