define(function(){
	var construct 	 = function(limit,local,configCallback){
		var actorsInitialised = 	0
		var actorsExited =		0
		var benchEnd = 			null
		var spawned = []

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == 2){
					configCallback(
						function(be){
							benchEnd 		= be
							producerRef.postMessage(["start"])
						},
						function(){
							producerRef.terminate()
							filterRef.terminate()
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
				if(actorsExited == totalActors){
					benchEnd()
				}
			}

			function end(){
				benchEnd()
			}

			
			function spawnNew(id,initPrime,sender){
				var ref = new Worker('./natSievePrimeFilter.js')
				spawned.push(ref)
				ref.onmessage = sysHandle
				ref.postMessage(["config",id,initPrime,local])
				var c = new MessageChannel()
				ref.postMessage(["link"],[c.port2])
				sender.postMessage(["newSpawned"],[c.port1])
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
					spawnNew(event.data[1],event.data[2],event.ports[0])
					break;
				default :
					console.log("Unknown message (System): " + event.data[0])
			}
		}
		var filterRef = new Worker('./natSievePrimeFilter.js')
		filterRef.onmessage = sysHandle
		filterRef.postMessage(["config",1,2,local])
		var producerRef = new Worker('./natSieveNumberProducer.js')
		producerRef.onmessage = sysHandle
		var c = new MessageChannel()
		filterRef.postMessage(["link"],[c.port2])
		producerRef.postMessage(["config",limit],[c.port1])
	}

	return function(configs,startCB){
		var limit 		= configs[0]
		var local 		= configs[1]
		construct(limit,local,startCB)
	}
})