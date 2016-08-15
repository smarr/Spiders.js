define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(N,B,W,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsExited: 		0,
				benchEnd: 			null,
				totalEnded: 		0,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == numBlocksInSingleDim * numBlocksInSingleDim){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								for(var bi = 0;bi < numBlocksInSingleDim;bi++){
									for(var bj = 0;bj < numBlocksInSingleDim;bj++){
										blockActors[bi][bj].start()
									}
								}
							},
							function(){
								killAll()
							}
						)
					}
				},

				actorInit: function(){
					this.actorsInitialised += 1
					this.checkConfig()
				},

				actorExit: function(){
					this.actorsExited += 1
					if(this.actorsExited == numBlocksInSingleDim * numBlocksInSingleDim){
						this.benchEnd()
					}
				},

				end: function(){
					this.benchEnd()
				},

			}

			var workerBehaviour = {
				myBlockId: 					null,
				blockSize: 					null,
				numNodes: 					null,
				W: 							null,
				neighbours: 				[],
				graphData: 					null,
				numBlocksInSingleDim: 		null,
				numNeighbors: 				null,
				rowOffset: 					null,
				colOffset: 					null,
				k: 							-1,
				neighborDataPerIteration: 	{},
				receivedNeighbors: 			false,
				currentIterData: 			null,
				dataCollected: 				0,

				config: function(myBlockId,blockSize,numNodes,W){
					this.myBlockId 				= myBlockId
					this.blockSize 				= blockSize
					this.numNodes 				= numNodes
					this.W 						= W
					var localData 				= {}
					for(var i = 0;i < numNodes;i++){
						localData[i] = {}
						for(var j = 0;j < numNodes;j++){
							if(!(j in localData)){
								localData[j] = {}
							}
							localData[i][j] = 0
							localData[j][i] = 0
						}
					}
					for(var i = 0;i < numNodes;i++){
						for(var j = i + 1;j < numNodes;j++){
							var r = Math.floor(Math.random() * (W - 0) + 0)
							localData[i][j] = r
							localData[j][i] = r
						}
					}
					this.graphData 				= localData
					this.numBlocksInSingleDim 	= Math.floor(numNodes / blockSize)
					this.numNeighbors			= 2 * (this.numBlocksInSingleDim - 1)
					this.rowOffset 				= (Math.floor(myBlockId / this.numBlocksInSingleDim)) * blockSize
					this.colOffset 				= (myBlockId % this.numBlocksInSingleDim) * blockSize
					this.currentIterData 		= this.getBlock(this.graphData,myBlockId)
				},

				newNeighbour: function(neighbourRef){
					this.neighbours.push(neighbourRef)
				},

				configDone: function(){
					this.system.actorInit()
				},

				getBlock: function(data,id){
					var localData = {}
					for(var i = 0;i < this.blockSize;i++){
						localData[i] = {}
						for(var j = 0;j < this.blockSize;j++){
							if(!(j in localData)){
								localData[j] = {}
							}
							localData[i][j] = 0
							localData[j][i] = 0
						}
					}
					var numBlocksPerDim = Math.floor(this.numNodes / this.blockSize)
					var globalStartRow 	= (Math.floor(id / numBlocksPerDim)) * this.blockSize
					var globalStartCol 	= (id % numBlocksPerDim) * this.blockSize
					for(var i = 0; i < this.blockSize;i++){
						for(var j = 0;j < this.blockSize;j++){
							var point = data[i + globalStartRow][j + globalStartCol]
							//console.log("Point: " + point)
							localData[i][j] = point
						}
					}
					return localData
				},

				notifyNeighbours: function(){
					for(var i in this.neighbours){
						for(var j in this.currentIterData){
							var row = this.currentIterData[j]
							//console.log(row)
							for(var z in row){
								this.neighbours[i].storeIterationData(this.k,this.myBlockId,j,z,row[z])
							}
						}
						this.neighbours[i].resultsDone()
					}
				},

				storeIterationData: function(k,id,colId,rowId,dataPoint){
					if(!(id in this.neighborDataPerIteration)){
						this.neighborDataPerIteration[id] = {}
					}
					if(!(colId in this.neighborDataPerIteration[id])){
						this.neighborDataPerIteration[id][colId] = {}
					}
					this.neighborDataPerIteration[id][colId][rowId] = dataPoint
				},

				elementAt: function(row,col,srcIter,prevIterData){
					var destBlockId = ((Math.floor(row / this.blockSize)) * this.numBlocksInSingleDim) + (Math.floor(col / this.blockSize))
					var localRow = row % this.blockSize
					var localCol = col % this.blockSize
					if(destBlockId == this.myBlockId){
						return prevIterData[localRow][localCol]
					}
					else{
						var blockData = this.neighborDataPerIteration[destBlockId]
						if(typeof blockData == 'undefined' || typeof blockData[localRow] == 'undefined'){
							return 0
						}
						else{
							return blockData[localRow][localCol]
						}
					}
				},

				performComputation: function(){
					var prevIterData = this.currentIterData
					this.currentIterData = {}
					for(var i = 0;i < this.blockSize;i++){
						this.currentIterData[i] = {}
						for(var j = 0;j < this.blockSize;j++){
							if(!(j in this.currentIterData)){
								this.currentIterData[j] = {}
							}
							this.currentIterData[i][j] = 0
							this.currentIterData[j][i] = 0
						}
					}
					for(var i = 0;i < this.blockSize;i++){
						for(var j = 0;j < this.blockSize;j++){
							var gi = this.rowOffset + i
							var gj = this.colOffset + j
							var newIterData = this.elementAt(gi, this.k, this.k - 1, prevIterData) + this.elementAt(this.k, gj, this.k - 1, prevIterData)
							//console.log("Return from element at: " + newIterData)
							var newElement 	= Math.min(prevIterData[i][j],newIterData)
							this.currentIterData[i][j] = newElement
						}
					}
				},

				start: function(){
					this.notifyNeighbours()
				},

				resultsDone: function(){
					this.dataCollected += 1
					if(this.dataCollected == this.numNeighbors){
						this.k += 1
						this.performComputation()
						this.notifyNeighbours()
						this.neighborDataPerIteration = {}
						this.dataCollected = 0
						if(this.k == (this.numNodes -1)){
							this.system.actorExit()
						}
					}
				}
			}

			

			systemActor(sysBehaviour)
			var numNodes 				= N
			var blockSize 				= B
			var numBlocksInSingleDim 	= Math.floor(numNodes / blockSize)
			var blockActors 			= {}
			for(var i = 0; i < numBlocksInSingleDim;i++){
				blockActors[i] = {}
				for(var j = 0;j < numBlocksInSingleDim;j++){
					var myBlockId = (i * numBlocksInSingleDim) + j
					var workerRef = actor(workerBehaviour)
					workerRef.config(myBlockId,blockSize,numNodes,W)
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
						current.newNeighbour(neighbours[i])
					}
				}
			}
			for(var bi = 0;bi < numBlocksInSingleDim;bi++){
				for(var bj = 0;bj < numBlocksInSingleDim;bj++){
					blockActors[bi][bj].configDone()
				}
			}
		},true)
	}

	return function(configs,startCB){
		var N	= configs[0]
		var B 	= configs[1]
		var W 	= configs[2]
		construct(N,B,W,startCB)
	}
})