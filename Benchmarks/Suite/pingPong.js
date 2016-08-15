define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfPings,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				pingInitialised: 	false,
				pongInitialised: 	false,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.pingInitialised && this.pongInitialised){
						configCallback(
							function(benchEnd){
								that.benchEnd = benchEnd
								pingRef.start()
							},
							function(){
								killAll()
							}
						)
					}
				},

				pingInit: 			function(){
					this.pingInitialised = true
					this.checkConfig()
				},

				pongInit: 			function(){
					this.pongInitialised = true
					this.checkConfig()
				},

				pingsExhausted: 	function(){
					this.benchEnd()
				}
			}

			var pingActor = {
				totalPings: null,
				pingsLeft: 	null,
				pongRef: 	null,

				init: 		function(){
					var fut = this.system.getRef("Pong")
					this.onResolve(fut,function(ref){
						this.pongRef = ref
						if(this.pingsLeft != null){
							this.system.pingInit()
						}
					})
				},

				config: 	function(amPings){
					this.totalPings = amPings
					this.pingsLeft 	= amPings
					if(this.pongRef != null){
						this.system.pingInit()
					}
				},

				start: 		function(){
					this.pingsLeft 	= this.totalPings
					this.pongRef.ping()
					this.pingsLeft -= 1
				},

				pong: 		function(){
					if(this.pingsLeft == 0){
						this.system.pingsExhausted()
					}
					else{
						this.pingsLeft -= 1
						this.pongRef.ping()
					}
				}

			}

			var pongActor = {
				pingRef: 	null,

				init: function(){
					var fut = this.system.getRef("Ping")
					this.onResolve(fut,function(ref){
						this.pingRef = ref
						this.system.pongInit()
					})
				},

				ping: function(){
					this.pingRef.pong()
				}
			}

			systemActor(sysBehaviour)
			var pingRef = actor(pingActor,"Ping")
			actor(pongActor,"Pong")
			pingRef.config(amountOfPings)
		},true)
	}

	return function(configs,startCB){
		var amPings = configs[0]
		construct(amPings,startCB)
	}
})