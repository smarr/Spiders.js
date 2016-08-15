define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfTerms,amountOfSeries,startRate,increment,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == (amountOfSeries *  2) +  1){
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
				}
			}

			var masterBehaviour = {
				totalTerms: 	0,
				workRequested: 	0,
				workReceived: 	0,
				workers: 		[],
				termsSum: 		0,

				newWorker: function(workerRef,totalWorkers,totalTerms){
					this.totalTerms = totalTerms
					this.workers.push(workerRef)
					if(this.workers.length == totalWorkers){
						this.system.actorInit()
					}
				},

				start: function(){
					var i = 0
					while(i < this.totalTerms){
						for(var j in this.workers){
							this.workers[j].nextTerm()
							this.workRequested += 1
						}
						i++
					}
				},

				result: function(term){
					this.termsSum 		+= term
					this.workReceived 	+= 1
					if(this.workRequested == this.workReceived){
						this.system.end()
					}
				}
			}

			var seriesWorkerBehaviour = {
				masterRef: 			null,
				rateComputerRef: 	null,
				startTerm: 			0,
				curTerm: 			0,

				config: function(masterRef,rateComputerRef,startTerm){
					this.masterRef 			= masterRef
					this.rateComputerRef 	= rateComputerRef
					this.startTerm 			= startTerm 
					this.curTerm 			= this.startTerm
					this.system.actorInit()
				},

				nextTerm: function(){
					var fut = this.rateComputerRef.compute(this.curTerm)
					this.onResolve(fut,function(res){
						this.curTerm = res
						this.masterRef.result(res)
					})
				}
			}

			var rateComputerBehaviour = {
				rate: 0,

				config: function(rate){
					this.rate = rate
					this.system.actorInit()
				},

				compute: function(term){
					return this.rate * term * (1 - term);
				}
			}




			systemActor(sysBehaviour)
			var masterRef 	= actor(masterBehaviour,amountOfSeries)
			var computers 	= []
			var compCount 	= amountOfSeries - 1
			while(compCount >= 0){
				var newComp = actor(rateComputerBehaviour)
				computers.push(newComp)
				var rate = startRate + (compCount * increment)
				newComp.config(rate)
				compCount -= 1
			}
			var workers 	= []
			var workCount 	= amountOfSeries - 1
			while(workCount >= 0){
				var newWork 		= actor(seriesWorkerBehaviour)
				masterRef.newWorker(newWork,amountOfSeries,amountOfTerms)
				var rateComputerRef = computers[workCount % computers.length]
				var startTerm 		= workCount * increment 
				newWork.config(masterRef,rateComputerRef,startTerm)
				workers.push(newWork)
				workCount 			-= 1
			}
		},true)
	}

	return function(configs,startCB){
		var amTerms 	= configs[0]
		var amSeries 	= configs[1]
		var startRate 	= configs[2]
		var increment 	= configs[3]
		construct(amTerms,amSeries,startRate,increment,startCB)
	}
})