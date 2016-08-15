define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(numWorkers,size,threshold,solutions,priorities,configCallback){
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
				solutions: 		null,
				priorities: 	null,
				numWorkers: 	null,
				workers: 		[],
				messageCounter: 		0,
				numWorkersTerminated: 	0,
				numWorkSent: 			0,
				numWorkCompleted: 		0,
				resultCounter: 			0,

				config: function(solutions,priorities,numWorkers){
					this.solutions 	= solutions
					this.priorities = priorities
					this.numWorkers = numWorkers 
				},

				addWorker: function(workerRef,id){
					this.workers[id] = workerRef
				},

				configDone: function(){
					this.system.actorInit()
				},

				start: function(){
					this.sendWork(this.priorities,this.isolate([]),0)
				},      

				sendWork: function(priority,data,depth){
					this.workers[this.messageCounter].work(priority,data,depth)
					this.messageCounter = (this.messageCounter + 1) % this.numWorkers
					this.numWorkSent   += 1
				},

				result: function(){
					this.resultCounter += 1
					if(this.resultCounter >= this.solutions){
						this.system.end()
					}
				},

				done: function(){
					this.numWorkCompleted += 1
					if(this.numWorkCompleted == this.numWorkSent){
						this.requestWorkersToTerminate()
					}
				}
			}

			var workerBehaviour = {
				masterRef: 				null,
				id: 					null,
				threshold: 				null,
				size: 					null,

				config: function(masterRef,id,threshold,size){
					this.masterRef 	= masterRef
					this.id 		= id
					this.threshold 	= threshold
					this.size 		= size
					this.system.actorInit()
				},

				arraycopy: function(a1,start1,a2,start2,until){
					var index = start2
					for(var i = start1;i < until;i++){
						a2[index] = a1[i]
						index += 1
					}
				},

				boardValid: function(depth,data){
					var p = 0
					var q = 0
					for(var i = 0;i < depth;i++){
						p = data[i]
						for(var j = (i + 1);j < data;j++){
							q = data[j]
							if(q == p || q == p - (j - i) || q == p + (j - 1)){
								return false
							}
						}
					}
					return true
				},

				workSequential: function(data,depth){
					if(this.size == depth){
						this.masterRef.result()
					}
					else{
						var b = []
						for(var i = 0;i < depth + 1;i++){
							b[i] = 0
						}
						var i = 0
						while(i < this.size){
							this.arraycopy(data,0,b,depth)
							b[depth] = i
							if(this.boardValid(depth + 1,b)){
								this.workSequential(b,depth + 1)
							}
							i += 1
						}
					}
				},

				work: function(priority,data,depth){
					if(this.size == depth){
						this.masterRef.result()
					}
					else if (depth >= this.threshold){
						this.workSequential(data,depth)
					}
					else{
						var newPriority = priority - 1
						var newDepth 	= depth + 1
						var i 			= 0
						while(i < this.size){
							var b = []
							for(var i =0;i < newDepth;i++){
								b[i] = 0
							}
							this.arraycopy(data,0,b,0,depth)
							b[depth] = i
							if(this.boardValid(newDepth,b)){
								this.masterRef.sendWork(newPriority,this.isolate(b),newDepth)
							}
							i += 1
						} 
					}
					this.masterRef.done()
				},

			}


			systemActor(sysBehaviour)
			var masterRef = actor(masterBehaviour)
			masterRef.config(solutions,priorities,numWorkers)
			var id = 0
			for(var i = 0;i < numWorkers;i++){
				var workerRef = actor(workerBehaviour)
				workerRef.config(masterRef,id,threshold,size)
				masterRef.addWorker(workerRef,id)
				id += 1
			}
			masterRef.configDone()
			
		},true)
	}

	return function(configs,startCB){
		var numWorkers	= configs[0]
		var size 		= configs[1]
		var threshold 	= configs[2]
		var solutions 	= configs[3]
		var priorities 	= configs[4]
		construct(numWorkers,size,threshold,solutions,priorities,startCB)
	}
})