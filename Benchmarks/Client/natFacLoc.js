define(function(){
	var construct 	 = function(numPoints,gridSize,F,alpha,cutOff,configCallback){
		var actorsInitialised = 	0
		var actorsExited = 		0
		var benchEnd =			null
		var totalSpawned = 		2
		var totalEnded = 		0
		var spawned = []

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == 2){
					configCallback(
						function(be){
							benchEnd 		= be
							prodRef.postMessage(["produceConsumer"])
						},
						function(){
							prodRef.terminate()
							quadRef.terminate()
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

			function spawnQuad(parent,index,positionToParent,bx1,by1,bx2,by2,threshold,depth,initKnownFacilities,initMaxDepthOpenFac){
				var c = new MessageChannel()
				parent.postMessage(["childQuadSpawned",index],[c.port2])
				var ref = new Worker('./natFacLocQuadrant.js')
				spawned.push(ref)
				ref.onmessage = sysHandle
				ref.postMessage(["config",false,positionToParent,bx1,by1,bx2,by2,threshold,depth,initKnownFacilities,initMaxDepthOpenFac],[c.port1])
				totalSpawned += 1
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
				case "spawnQuad":
					spawnQuad(event.ports[0],event.data[1],event.data[2],event.data[3],event.data[4],event.data[5],event.data[6],event.data[7],event.data[8],event.data[9],event.data[10])
					break;
				default :
					console.log("Unknown message (System): " + event.data[0])
			}
		}
		var threshold 	= alpha * F
		var quadRef = new Worker('./natFacLocQuadrant.js')
		quadRef.onmessage = sysHandle
		quadRef.postMessage(["config",true,0,"ROOT",0,0,gridSize,gridSize,threshold,0,1,-1])
		quadRef.postMessage(["configDone",false])
		var prodRef = new Worker('./natFacLocProducer.js')
		prodRef.onmessage = sysHandle
		var chan = new MessageChannel()
		quadRef.postMessage(["link"],[chan.port2])
		prodRef.postMessage(["config",gridSize,numPoints],[chan.port1])
	}

	return function(configs,startCB){
		var numPoints 	= configs[0]
		var gridSize 	= configs[1]
		var F 			= configs[2]
		var alpha 		= configs[3]
		var cutOff 		= configs[4]
		construct(numPoints,gridSize,F,alpha,cutOff,startCB)
	}
})