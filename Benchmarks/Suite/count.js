define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfCounts,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				prodInitialised: 	false,
				countInitialised: 	false,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.prodInitialised && this.countInitialised){
						configCallback(
							function(benchEnd){
								that.benchEnd = benchEnd
								prodRef.start()
							},
							function(){
								killAll()
							}
						)
					}
				},

				prodInit: 			function(){
					this.prodInitialised = true
					this.checkConfig()
				},

				countInit: 			function(){
					this.countInitialised = true
					this.checkConfig()
				},

				countsExhausted: 	function(){
					this.benchEnd()
				}
			}

			var producerBehaviour = {
				totalCount: null,
				countsLeft: null,
				countRef: 	null,

				init: function(){
					var fut = this.system.getRef("Counter")
					this.onResolve(fut,function(ref){
						this.countRef = ref
						if(this.totalCount != null){
							this.system.prodInit()
						}
					})
				},

				config: function(countNumber){
					this.totalCount = countNumber
					this.countsLeft = countNumber
					if(this.countRef != null){
						this.system.prodInit()
					}
				},

				start: function(){
					this.countsLeft = this.totalCount
					this.countRef.inc(true)
					while(this.countsLeft > 0){
						this.countRef.inc(false)
						this.countsLeft -= 1
					}
				}

			}

			var countBehaviour = {
				totalCount: null,
				countSoFar: null,

				config: function(countNumber){
					this.totalCount = countNumber
					this.countSoFar = 0
					this.system.countInit()
				},

				inc: function(fresh){
					if(fresh){
						this.countSoFar = 0
					}
					else{
						this.countSoFar += 1
						if(this.countSoFar == this.totalCount){
							this.system.countsExhausted()
						}
					}
				}
			}


			systemActor(sysBehaviour)
			var prodRef = actor(producerBehaviour,"Producer")
			var countRef = actor(countBehaviour,"Counter")
			prodRef.config(amountOfCounts)
			countRef.config(amountOfCounts)

		},true)
	}

	return function(configs,startCB){
		var amCounts = configs[0]
		construct(amCounts,startCB)
	}
})