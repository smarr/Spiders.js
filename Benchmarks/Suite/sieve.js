define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(limit,local,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsExited: 		0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == 2){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								producerRef.start()
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
					if(this.actorsExited == totalActors){
						this.benchEnd()
					}
				},

				end: function(){
					this.benchEnd()
				},

				spawnNew: function(id,initPrime){
					var ref = actor(primeFilterBehaviour)
					ref.config(id,initPrime,local)
					return ref
				}
			}


			var numberProducerBehaviour = {
				limit: 		null,
				filterRef: 	null,

				config: function(limit,filterRef){
					this.limit 		= limit
					this.filterRef 	= filterRef 
					this.system.actorInit()
				},

				start: function(){
					var candidate = 3
					while(candidate < this.limit){
						this.filterRef.longBox(candidate)
						candidate += 2
					}
					this.filterRef.stop()
				}

			}

			var primeFilterBehaviour = {
				local: 			null,
				id: 			null,
				initPrime: 		null,
				nextFilter: 	null,
				localPrimes: 	[],
				available: 		1, 

				config: function(id,initPrime,local){
					this.local 		= local
					this.id 		= id
					this.initPrime	= initPrime
					this.system.actorInit()
					this.localPrimes[0] 	= initPrime
				},

				isLocallyPrime: function(candidate,startInc,endExc){
					for (var i = startInc; i < endExc; i++) {
					    var remainder = candidate % this.localPrimes[i];
					    if(remainder == 0){
					        return false;
					    }
					}
					return true;
				},

				handleNewPrime: function(candidate){
					if(this.available < this.local){
						this.localPrimes[this.available] = candidate
						this.available += 1
					}
					else{
						var fut = this.system.spawnNew(this.id + 1,candidate)
						this.onResolve(fut,function(ref){
							this.nextFilter = ref
						})
					}
				},

				longBox: function(candidate){
					var localPrime = this.isLocallyPrime(candidate,0,this.available)
					if(localPrime){
						if(this.nextFilter == null){
							this.handleNewPrime(candidate)
						}
						else{
							this.nextFilter.longBox(candidate)
						}
					}
				},

				stop: function(){
					if(this.nextFilter == null){
						this.system.end()
					}
					else{
						this.nextFilter.stop()
					}
				}
			}






			systemActor(sysBehaviour)
			var filterRef 	= actor(primeFilterBehaviour)
			filterRef.config(1,2,local)
			var producerRef = actor(numberProducerBehaviour)
			producerRef.config(limit,filterRef)
		},true)
	}

	return function(configs,startCB){
		var limit 		= configs[0]
		var local 		= configs[1]
		construct(limit,local,startCB)
	}
})