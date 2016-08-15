define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(dataSize,maxValue,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsExited: 		0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == totalActors){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								sourceRef.nextActor(nextActor)
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
				}
			}

			sourceBehaviour  ={
				dataSize: 	0,
				maxValue: 	0,

				config: function(dataSize,maxValue){
					this.dataSize = dataSize
					this.maxValue = maxValue
					this.system.actorInit()
				},

				getRandom: function(upper){
					return Math.floor(Math.random() * (upper - 0) + 0)
				},

				nextActor: function(nextRef){
					var i = 0
					while(i < this.dataSize){
						var candidate = this.getRandom(100000) % this.maxValue
						nextRef.value(candidate)
						i++
					}
					this.system.actorExit()
				}

			}

			sortBehaviour = {
				dataSize: 	0,
				radix: 		0,
				nextRef: 	null, 
				valueSoFar: 0,
				j: 			0, 
				ordering: 	[],		

				config: function(dataSize,radix,nextRef){
					this.dataSize 	= dataSize
					this.radix 		= radix
					this.nextRef 	= nextRef
					this.system.actorInit()
				},

				value: function(candidate){
					this.valueSoFar += 1
					var current = candidate
					if((current & this.radix) == 0){
						this.nextRef.value(candidate)
					}
					else{
						this.ordering[this.j] 	= candidate
						this.j 					+= 1
					}
					if(this.valueSoFar == this.dataSize){
						var i = 0
						while(i < this.j){
							this.nextRef.value(this.ordering[i])
							i++
						}
						this.system.actorExit()
					}

				}

			}

			validationBehaviour = {
				dataSize: 		0,
				sumSoFar: 		0,
				valueSoFar: 	0,
				prevValue: 		0,
				errorValue1: 	-1,
				errorValue2: 	-1,

				config: function(dataSize){
					this.dataSize = dataSize
					this.system.actorInit()
				},

				value: function(candidate){
					this.valueSoFar += 1
					if(candidate < this.prevValue && this.errorValue1 < 0){
						this.errorValue2 = candidate
						this.errorValue1 = this.valueSoFar - 1 
					}
					this.prevValue = candidate
					this.sumSoFar += this.prevValue	
					if(this.valueSoFar == this.dataSize){
						if(this.errorValue1 >= 0){
							//console.log
						}
						else{
							//console.log
						}
						this.system.actorExit()
					}
				}
			}



			systemActor(sysBehaviour)
			var sourceRef 	= actor(sourceBehaviour)
			sourceRef.config(dataSize,maxValue)
			var validRef 	= actor(validationBehaviour)
			validRef.config(dataSize)
			var totalActors = 2
			var radix 		= Math.floor(maxValue /  2)
			var nextActor 	= validRef
			while(Math.floor(radix) > 0){
				var localRadix 		= radix
				var localNextActor	= nextActor
				var sortRef 		= actor(sortBehaviour)
				sortRef.config(dataSize,localRadix,localNextActor)
				radix 				= radix / 2
				totalActors			+= 1
				nextActor 			= sortRef
			}
		},true)
	}

	return function(configs,startCB){
		var dataSize 	= configs[0]
		var maxValue 	= configs[1]
		construct(dataSize,maxValue,startCB)
	}
})