define(function(){
	var construct 	 = function(dataSize,maxValue,configCallback){
		var actorsInitialised = 	0
		var actorsExited = 		0
		var benchEnd =			null

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == totalActors){
					configCallback(
						function(be){
							benchEnd 		= be
							var chan = new MessageChannel()
							nextActor.postMessage(["link"],[chan.port2])
							sourceRef.postMessage(["nextActor"],[chan.port1])
						},
						function(){
							sourceRef.terminate()
							validRef.terminate()
							for(var i in allActors){
								allActors[i].terminate()
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
					console.log("Unknown message: " + event.data[0])
			}
		}

		var sourceRef = new Worker('./natRadixSortSource.js')
		sourceRef.onmessage = sysHandle
		sourceRef.postMessage(["config",dataSize,maxValue])
		var validRef = new Worker('./natRadixSortValidation.js')
		validRef.onmessage = sysHandle
		validRef.postMessage(["config",dataSize])
		var totalActors = 2
		var radix 		= Math.floor(maxValue /  2)
		var nextActor 	= validRef
		var allActors = []
		while(Math.floor(radix) > 0){
			var localRadix 		= radix
			var localNextActor 	= nextActor
			var sortRef 		= new Worker('./natRadixSortSort.js')
			allActors.push(sortRef)
			sortRef.onmessage = sysHandle
			var chan = new MessageChannel()
			localNextActor.postMessage(["link"],[chan.port2])
			sortRef.postMessage(["config",dataSize,localRadix],[chan.port1])
			radix 				= radix / 2
			totalActors			+= 1
			nextActor 			= sortRef
		}
	}

	return function(configs,startCB){
		var dataSize 	= configs[0]
		var maxValue 	= configs[1]
		construct(dataSize,maxValue,startCB)
	}
})