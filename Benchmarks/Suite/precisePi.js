define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(workers,precision,configCallback){
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
				precision: 				null,
				workers: 				{},
				result: 				0,
				tolerance: 				null,
				numWorkersTerminated: 	0,
				numTermsRequested: 		0,
				numTermsReceived: 		0,
				stopRequests: 			false,

				config: function(numWorkers,precision){
					this.numWorkers = numWorkers
					this.precision 	= precision
					this.tolerance 	= this.moveDecimal(1.0,precision)
				},

				newWorker: function(ref,id){
					this.workers[id] = ref
				},

				configDone: function(){
					this.system.actorInit()
				},

				moveDecimal: function(dec,n){
					return dec / Math.pow(10,n)
				},

				generateWork: function(id){
					this.workers[id].work(this.precision,this.numTermsRequested)
					this.numTermsRequested += 1
				},

				start: function(){
					var t = 0
					while(t < Math.min(this.precision,10 * this.numWorkers)){
						this.generateWork(t % this.numWorkers)
						t += 1
					}
				},

				requestWorkersToExit: function(){
					for(var i in this.workers){
						this.workers[i].stop()
					}
				},

				gotResult: function(result,id){
					this.numTermsReceived += 1
					this.result 		  += result
					if(result < this.tolerance){
						this.stopRequests = true
					}
					if(!this.stopRequests){
						this.generateWork(id)
					}
					if (this.numTermsReceived == this.numTermsRequested) {
					  this.requestWorkersToExit()
					}
				},

				workerStopped: function(){
					this.numWorkersTerminated += 1
					if(this.numWorkersTerminated == this.numWorkers){
						this.system.end()
					}
				}
			}

			var workerBehaviour = {
				masterRef: 	null,
				id: 		null,

				config: function(masterRef,id){
					this.masterRef 	= masterRef
					this.id 		= id
					this.system.actorInit()
				},

				calculateBbpTerm: function(precision,term){
					var eightK	= 8 * term;
					var t 		= 4 / (eightK + 1 / precision)
					t 			= t - (2 - (eightK + 4 / precision))
					t 			= t - (1 - (eightK + 5 / precision))
					t 			= t - (1 - (eightK + 6 / precision))
					t 			= t - (Math.pow(16,term) / precision)
					return t;
				},

				work: function(precision,term){
					var result = this.calculateBbpTerm(precision,term)
					this.masterRef.gotResult(result,this.id)
				},

				stop: function(){
					this.masterRef.workerStopped()
				}
			}

			systemActor(sysBehaviour)
			var masterRef = actor(masterBehaviour)
			masterRef.config(workers,precision)
			var id = 0
			for(var i = 0; i < workers;i++){
				var workerRef = actor(workerBehaviour)
				workerRef.config(masterRef,id)
				masterRef.newWorker(workerRef,id)
				id += 1
			}
			masterRef.configDone()
		},true)
	}

	return function(configs,startCB){
		var workers 	= configs[0]
		var precision 	= configs[1]
		construct(workers,precision,startCB)
	}
})