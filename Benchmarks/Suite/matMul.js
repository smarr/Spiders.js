define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(workers,dataLength,threshold,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsExited: 		0,
				benchEnd: 			null,
				totalEnded: 		0,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == workers + 1){
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

				actorExit: function(){
					this.actorsExited += 1
					if(this.actorsExited == (workers + 1)){
						this.benchEnd()
					}
				},

				end: function(){
					this.benchEnd()
				},

			}

			var masterBehaviour = {
				numWorkers: 			null, 
				dataLength: 			null,
				workers: 				{},
				numWorkersTerminated: 	0,
				numWorkSent: 			0,
				numWorkCompleted: 		0,

				config: function(numWorkers,dataLength){
					this.numWorkers = numWorkers
					this.dataLength = dataLength
				},

				newWorker: function(workerRef,id){
					this.workers[id] = workerRef
				},

				configDone: function(){
					this.system.actorInit()
				},

				start: function(){
					var numBlocks 	= this.dataLength * this.dataLength
					this.sendWork(0, 0, 0, 0, 0, 0, 0, numBlocks, this.dataLength)
				},

				sendWork: function(priority,srA,scA,srB,scB,srC,scC,numBlocks,dim){
					var workerIndex = (srC + scC) % this.numWorkers
					this.workers[workerIndex].work(priority,srA,scA,srB,scB,srC,scC,numBlocks,dim)
					this.numWorkSent += 1
				},

				done: function(){
					this.numWorkCompleted += 1
					if(this.numWorkCompleted == this.numWorkSent){
						for(var i in this.workers){
							this.workers[i].stop()
						}
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
				threshold: 	null,
				dataLength: null,
				id: 		null,
				masterRef: 	null,
				A: 			{},
				B: 			{},
				C: 			{},

				config: function(masterRef,id,threshold,dataLength){
					this.threshold	= threshold
					this.masterRef 	= masterRef
					this.id 		= id
					this.dataLength = dataLength
					for(var i = 0;i < this.dataLength;i++){
						this.A[i] = {}
						this.B[i] = {}
						this.C[i] = {}
						for(var j = 0;j < this.dataLength;j++){
							this.A[i][j] = i
							this.B[i][j] = j
							this.C[i][j] = 0
						}
					}
					this.system.actorInit()
				},

				work: function(priority,srA,scA,srB,scB,srC,scC,numBlocks,dim){
					var newPriority = priority + 1
					if(numBlocks > this.threshold){
						var zerDim 			= 0
						var newDim 			= dim / 2
						var newNumBlocks 	= numBlocks / 4
						this.masterRef.sendWork(newPriority,srA + zerDim,scA + zerDim,srB + zerDim,scB + zerDim,srC + zerDim,scC + zerDim,newNumBlocks,newDim)
						this.masterRef.sendWork(newPriority,srA + zerDim,scA + newDim,srB + newDim,scB + zerDim,srC + zerDim,scC + zerDim,newNumBlocks,newDim)
						this.masterRef.sendWork(newPriority,srA + zerDim,scA + zerDim,srB + zerDim,scB + newDim,srC + zerDim,scC + newDim,newNumBlocks,newDim)
						this.masterRef.sendWork(newPriority,srA + zerDim,scA + newDim,srB + newDim,scB + newDim,srC + zerDim,scC + newDim,newNumBlocks,newDim)
						this.masterRef.sendWork(newPriority,srA + newDim,scA + zerDim,srB + zerDim,scB + zerDim,srC + newDim,scC + zerDim,newNumBlocks,newDim)
						this.masterRef.sendWork(newPriority,srA + newDim,scA + newDim,srB + newDim,scB + zerDim,srC + newDim,scC + zerDim,newNumBlocks,newDim)
						this.masterRef.sendWork(newPriority,srA + newDim,scA + zerDim,srB + zerDim,scB + newDim,srC + newDim,scC + newDim,newNumBlocks,newDim)
						this.masterRef.sendWork(newPriority,srA + newDim,scA + newDim,srB + newDim,scB + newDim,srC + newDim,scC + newDim,newNumBlocks,newDim)
					}
					else{
						var endR = srC + dim
						var endC = scC + dim
						var i = srC
						while(i < endR){
							var j = scC
							while(j < endC){
								var k = 0
								while(k < dim){
									this.C[i][j] += this.A[i][scA + k] * this.B[srB + k][j]
									k += 1
								}
								j += 1
							}
							i += 1
						}
					}
					this.masterRef.done()
				},

				stop: function(){
					this.masterRef.stop()
				}
			}

			

			systemActor(sysBehaviour)
			var masterRef = actor(masterBehaviour)
			masterRef.config(workers,dataLength)
			var id = 0
			for(var i = 0; i < workers;i++){
				var workerRef = actor(workerBehaviour)
				workerRef.config(masterRef,id,threshold,dataLength)
				masterRef.newWorker(workerRef,id)
				id += 1
			}
			masterRef.configDone()
		},true)
	}

	return function(configs,startCB){
		var workers 	= configs[0]
		var dataLength 	= configs[1]
		var threshold 	= configs[2]
		construct(workers,dataLength,threshold,startCB)
	}
})