define(function(){
	var construct 	 = function(dataSize,maxVal,threshold,configCallback){
		var actorsInitialised = 	0
		var actorsExited = 		0
		var benchEnd = 			null
		var totalEnded = 		0
		var totalSpawned = 		1
		var spawned = []

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == 1){
					configCallback(
						function(be){
							benchEnd 		= be
							quickRef.postMessage(["sort"])
						},
						function(){
							quickRef.terminate()
							for(var i in spawned){
								spawned[i].terminate()
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
				if(actorsExited == totalSpawned){
					benchEnd()
				}
			}

			function end(){
				benchEnd()
			}

			function spawnNew(parentRef,position){
				var chan = new MessageChannel()
				parentRef.postMessage(["childSpawned",position],[chan.port2])
				var qRef = new Worker('./natQuicksortActor.js')
				spawned.push(qRef)
				qRef.onmessage = sysHandle
				qRef.postMessage(["config",true,dataSize,maxVal,threshold,position],[chan.port1])
				this.totalSpawned += 1
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
				case "spawnNew":
					spawnNew(event.ports[0],event.data[1])
					break;
				default :
					console.log("Unknown message (System): " + event.data[0])
			}
		}
		var quickRef = new Worker('./natQuicksortActor.js')
		quickRef.onmessage = sysHandle
		quickRef.postMessage(["config",false,dataSize,maxVal,threshold,0,"INITIAL"])
		for(var i = 0;i < dataSize;i++){
			var data = Math.floor(Math.random() * (maxVal - 0) + 0) % maxVal
			quickRef.postMessage(["newData",data])
		}
		quickRef.postMessage(["configDone"])
	}

	return function(configs,startCB){
		var dataSize 	= configs[0]
		var maxVal 		= configs[1]
		var threshold 	= configs[2]
		construct(dataSize,maxVal,threshold,startCB)
	}
})