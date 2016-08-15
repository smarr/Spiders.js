define(function(){
	var construct 	 = function(N,B,W,configCallback){
		actorsInitialised = 	0
		actorsExited = 		0
		benchEnd =			null
		totalEnded =		0

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == numBlocksInSingleDim * numBlocksInSingleDim){
					configCallback(
						function(be){
							benchEnd 		= be
							for(var bi = 0;bi < numBlocksInSingleDim;bi++){
								for(var bj = 0;bj < numBlocksInSingleDim;bj++){
									blockActors[bi][bj].postMessage(["start"])
								}
							}
						},
						function(){
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
				if(actorsExited == numBlocksInSingleDim * numBlocksInSingleDim){
					benchEnd()
				}
			}

			function end(){
				this.benchEnd()
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
		var numNodes 				= N
		var blockSize 				= B
		var numBlocksInSingleDim 	= Math.floor(numNodes / blockSize)
		var blockActors 			= {}
		var allActors 				= []
		for(var i = 0; i < numBlocksInSingleDim;i++){
			blockActors[i] = {}
			for(var j = 0;j < numBlocksInSingleDim;j++){
				var myBlockId = (i * numBlocksInSingleDim) + j
				var workerRef = new Worker('./natApspWorker.js')
				allActors.push(workerRef)
				workerRef.onmessage = sysHandle
				workerRef.postMessage(["config",myBlockId,blockSize,numNodes,W])
				blockActors[i][j] = workerRef
			}
		}
		for(var bi = 0;bi < numBlocksInSingleDim;bi++){
			for(var bj = 0;bj < numBlocksInSingleDim;bj++){
				var neighbours = []
				for(var r = 0;r < numBlocksInSingleDim;r++){
					if(r != bi){
						neighbours.push(blockActors[r][bj])
					}
				}
				for(var c = 0;c < numBlocksInSingleDim;c++){
					if(c != bj){
						neighbours.push(blockActors[bi][c])
					}
				}
				var current = blockActors[bi][bj]
				for(var i in neighbours){
					var chan = new MessageChannel()
					current.postMessage(["newNeighbour"],[chan.port2])
					neighbours[i].postMessage(["link"],[chan.port1])
				}
			}
		}
		for(var bi = 0;bi < numBlocksInSingleDim;bi++){
			for(var bj = 0;bj < numBlocksInSingleDim;bj++){
				blockActors[bi][bj].postMessage(["configDone"])
			}
		}
	}

	return function(configs,startCB){
		var N	= configs[0]
		var B 	= configs[1]
		var W 	= configs[2]
		construct(N,B,W,startCB)
	}
})