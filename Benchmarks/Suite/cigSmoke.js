define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfRounds,amountOfSmokers,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == amountOfSmokers +  1){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								arbiterRef.pickRandom()
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

			var arbiterBehaviour = {
				totalRounds: 	0,
				currentRounds: 	0,
				totalSmokers: 	0,
				smokers: 		[],

				config: function(totalRounds,totalSmokers){
					this.totalRounds 	= totalRounds
					this.totalSmokers 	= totalSmokers 
				},

				newSmoker: function(smokerRef){
					this.smokers.push(smokerRef)
					if(this.smokers.length == this.totalSmokers){
						this.system.actorInit()
					}
				},

				getRandom: function(upper){
					return Math.floor(Math.random() * (upper - 0) + 0)
				},

				pickRandom: function(){
					var index = this.getRandom(this.totalSmokers)
					var time  = this.getRandom(1000)
					this.smokers[index].startSmoking(time)
				},

				startedSmoking: function(){
					this.currentRounds += 1
					if(this.currentRounds >= this.totalRounds){
						this.system.end()
					}
					else{
						this.pickRandom()
					}
				}

			}

			var smokerBehaviour = {
				arbiterRef: null,

				init: function(){
					var fut = this.system.getRef("arbiter")
					this.onResolve(fut,function(arbiterRef){
						this.arbiterRef = arbiterRef
						this.system.actorInit()
					})
				},

				busyWait: function(limit){
					for(var i = 0;i < limit;i++){
						Math.floor(Math.random() * (limit - 0 + 1)) + 0;
					}
				},

				startSmoking: function(time){
					this.arbiterRef.startedSmoking()
					this.busyWait(time)
				}
			}



			systemActor(sysBehaviour)
			var arbiterRef = actor(arbiterBehaviour,"arbiter")
			arbiterRef.config(amountOfRounds,amountOfSmokers)
			var smokCount 	= amountOfSmokers - 1
			while(smokCount >= 0){
				var newSmok = actor(smokerBehaviour)
				arbiterRef.newSmoker(newSmok)
				smokCount -= 1
			}
		},true)
	}

	return function(configs,startCB){
		var amRounds 	= configs[0]
		var amSmokers 	= configs[1]
		construct(amRounds,amSmokers,startCB)
	}
})