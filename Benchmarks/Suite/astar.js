define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(numWorkers,threshold,gridSize,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsExited: 		0,
				benchEnd: 			null,
				totalEnded: 		0,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == 1 + numWorkers){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								masterRef.start()
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

				end: function(){
					this.benchEnd()
				},
			}

			
			var masterBehaviour = {
				numWorkers: 			null,
				workers: 				[],
				numWorkersTerminated: 	0,
				numWorkSent: 			0,
				numWorkCompleted: 		0,
				grid: 					null,
				gridSize: 				null,

				//Graph stuff
				makeNode: function(id,i,j,k,neighbors){
					return [id,i,j,k,neighbors,id == 0 ? 0 : -1,null]
				},
				getId: function(node){
					return node[0]
				},
				getI: function(node){
					return node[1]
				},
				getJ: function(node){
					return node[2]
				},
				getK: function(node){
					return node[3]
				},
				setParentInPath: function(node,newParent){
					node[6] = newParent
				},
				addNeighbor: function(node,newNeighbor){
					var currentNeighbours = node[4]
					if(this.getId(newNeighbor) == this.getId(node)){
						return false
					}
					else{
						var alreadyIn = false
						for(var i in currentNeighbours){
							if(this.getId(currentNeighbours[i]) == this.getId(newNeighbor)){
								alreadyIn = true
							}
						}
						if(!alreadyIn){
							currentNeighbours.push(newNeighbor)
						}
						return (!alreadyIn)
					}
				},
				randBool: function(){
					var val = Math.floor(Math.random() * (2 - 0) + 0)
					if(val == 0){
						return false
					}
					else{
						return true
					}
				},
				generateData: function(){
					var allNodes 	= {}
					var id 			= 0
					for(var i = 0;i < this.gridSize;i++){
						for(var j = 0;j < this.gridSize;j++){
							for(var k = 0;k < this.gridSize;k++){
								var node = this.makeNode(id,i,j,k,[])
								allNodes[id] = node
								id++
							}
						}
					}
					for(var i in allNodes){
						var gridNode 		= allNodes[i]
						var iterCount 		= 0
						var neighborCount	= 0
						for(var i = 0;i < 2;i++){
							for(var j = 0;j < 2;j++){
								for(var k = 0;k < 2;k++){
									iterCount++
									if(iterCount != 1 && iterCount != 8){
										var addNeighbor = (iterCount == 7 && neighborCount == 0) || this.randBool()
										if(addNeighbor){
											var newI 	= Math.min(this.gridSize - 1,this.getI(gridNode) + i)
											var newJ 	= Math.min(this.gridSize - 1,this.getJ(gridNode) + j)
											var newK 	= Math.min(this.gridSize - 1,this.getK(gridNode) + k)
											var newId 	= (this.gridSize * this.gridSize * newI) + (this.gridSize * newJ) + newK
											var newNode	= allNodes[newId]
											if(this.addNeighbor(gridNode,newNode)){
												neighborCount++
											}
										}
									}
								}
							}
						}
					}
					return allNodes
				},

				config: function(numWorkers,gridSize){
					this.numWorkers = numWorkers
					this.gridSize 	= gridSize
					this.grid 		= this.generateData()
				},

				addWorker: function(workerRef,id){
					this.workers[id] = workerRef
				},

				configDone: function(){
					this.system.actorInit()
				},

				start: function(){
					var origin 		= this.grid[0]
					var axisVal 	= 0.80 * this.gridSize;
					var targetId 	= (axisVal * this.gridSize * this.gridSize) + (axisVal * this.gridSize) + axisVal;
					var targetNode	= this.grid[targetId]
					this.sendWork(origin,targetNode)
				},

				sendWork: function(origin,target){
					var workerIndex = this.numWorkSent % this.numWorkers
					this.numWorkSent += 1
					this.workers[workerIndex].work(this.isolate(origin),this.isolate(target))
				},

				updateNodeParent: function(nodeId,newParent){
					var node = this.grid[nodeId]
					this.setParentInPath(node,newParent)
				},

				done: function(){
					for(var i in this.workers){
						this.workers[i].stop()
					}
				},

				stop: function(){
					this.numWorkersTerminated += 1
					if(this.numWorkersTerminated == this.numWorkers){
						this.system.end()
					}
				}
			}

			var workerBehaviour = {
				masterRef: 	null,
				threshold: 	null,
				grid: 		null,
				gridSize: 	null,

				//Graph stuff
				makeNode: function(id,i,j,k,neighbors){
					return [id,i,j,k,neighbors,id == 0 ? 0 : -1,null]
				},
				getId: function(node){
					return node[0]
				},
				getI: function(node){
					return node[1]
				},
				getJ: function(node){
					return node[2]
				},
				getK: function(node){
					return node[3]
				},
				getNeighbors: function(node){
					return node[4]
				},
				getDistanceFromRoot: function(node){
					return node[5]
				},
				setDistanceFromRoot: function(node,dist){
					node[5] =  dist
				},
				getParentInPath: function(node){
					return node[6]
				},
				setParentInPath: function(node,newParent){
					node[6] = newParent
				},
				setParent: function(node,newParent){
					var success = this.getParentInPath(node) == null
					if(success){
						this.setParentInPath(node,newParent)
						this.setDistanceFromRoot(node,this.getDistanceFromRoot(node) + this.distanceFrom(node,newParent))
					}
					return success
				},
				distanceFrom: function(node1,node2){
					var iDiff = this.getI(node1) - this.getI(node2)
					var jDiff = this.getJ(node1) - this.getJ(node2)
					var kDiff = this.getK(node1) - this.getK(node2)
					return Math.sqrt((iDiff * iDiff) + (jDiff * jDiff) + (kDiff * kDiff))
				},
				addNeighbor: function(node,newNeighbor){
					var currentNeighbours = node[4]
					if(this.getId(newNeighbor) == this.getId(node)){
						return false
					}
					else{
						var alreadyIn = false
						for(var i in currentNeighbours){
							if(this.getId(currentNeighbours[i]) == this.getId(newNeighbor)){
								alreadyIn = true
							}
						}
						if(!alreadyIn){
							currentNeighbours.push(newNeighbor)
						}
						return (!alreadyIn)
					}
				},
				randBool: function(){
					var val = Math.floor(Math.random() * (2 - 0) + 0)
					if(val == 0){
						return false
					}
					else{
						return true
					}
				},
				generateData: function(){
					var allNodes 	= {}
					var id 			= 0
					for(var i = 0;i < this.gridSize;i++){
						for(var j = 0;j < this.gridSize;j++){
							for(var k = 0;k < this.gridSize;k++){
								var node = this.makeNode(id,i,j,k,[])
								allNodes[id] = node
								id++
							}
						}
					}
					for(var i in allNodes){
						var gridNode 		= allNodes[i]
						var iterCount 		= 0
						var neighborCount	= 0
						for(var i = 0;i < 2;i++){
							for(var j = 0;j < 2;j++){
								for(var k = 0;k < 2;k++){
									iterCount++
									if(iterCount != 1 && iterCount != 8){
										var addNeighbor = (iterCount == 7 && neighborCount == 0) || this.randBool()
										if(addNeighbor){
											var newI 	= Math.min(this.gridSize - 1,this.getI(gridNode) + i)
											var newJ 	= Math.min(this.gridSize - 1,this.getJ(gridNode) + j)
											var newK 	= Math.min(this.gridSize - 1,this.getK(gridNode) + k)
											var newId 	= (this.gridSize * this.gridSize * newI) + (this.gridSize * newJ) + newK
											var newNode	= allNodes[newId]
											if(this.addNeighbor(gridNode,newNode)){
												neighborCount++
											}
										}
									}
								}
							}
						}
					}
					return allNodes
				},

				config: function(masterRef,threshold,gridSize){
					this.masterRef 	= masterRef
					this.threshold 	= threshold
					this.gridSize 	= gridSize
					this.grid 		= this.generateData()
					this.system.actorInit()
				},

				work: function(origin,target){
					var workQueue 		= []
					workQueue.push(origin)
					var nodesProcessed 	= 0
					while(!(workQueue.length == 0) && nodesProcessed < this.threshold){
						//console.log("Processed: " + nodesProcessed + " threshold: " + this.threshold)
						nodesProcessed += 1
						//Busy wait
						for(var i = 0;i < 100;i++){
							Math.random()
						}
						var loopNode 		= workQueue.pop()
						var numNeighbors 	= (this.getNeighbors(loopNode)).length
						var i = 0
						while(i < numNeighbors){
							var loopNeighbor 	= this.getNeighbors(loopNode)[i]
							var success 		= this.setParent(loopNeighbor,loopNode)
							this.masterRef.updateNodeParent(this.getId(loopNeighbor),this.isolate(loopNode))
							//console.log("Success: " + success + " loop id : " + this.getId(loopNeighbor) + " target id : " + this.getId(target))
							if(success){
								if(this.getId(loopNeighbor) == this.getId(target)){
									this.masterRef.done()
								}
								else{
									//Obviously scandalous regarding efficiency but will do for the moment
									workQueue.reverse()
									workQueue.push(loopNeighbor)
									workQueue.reverse()
								}
							}
							i += 1
						}
					}
					while(!(workQueue.length == 0)){
						var loopNode = workQueue.pop()
						this.masterRef.sendWork(this.isolate(loopNode),this.isolate(target))
					}
				},

				stop: function(){
					this.masterRef.stop()
				}
			}



			

			systemActor(sysBehaviour)
			var masterRef = actor(masterBehaviour)
			masterRef.config(numWorkers,gridSize)
			var id = 0
			for(var i = 0;i < numWorkers;i++){
				var workerRef = actor(workerBehaviour)
				workerRef.config(masterRef,threshold,gridSize)
				masterRef.addWorker(workerRef,id)
				id += 1
			}
			masterRef.configDone()
			
		},true)
	}

	return function(configs,startCB){
		var numWorkers	= configs[0]
		var threshold 	= configs[1]
		var gridSize 	= configs[2]
		construct(numWorkers,threshold,gridSize,startCB)
	}
})