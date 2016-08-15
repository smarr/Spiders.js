define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfActors,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsDone: 		0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == amountOfActors){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								that.actorsDone 	= 0
								for(var i in actors){
									actors[i].newMessage()
								}
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

				actorDone: function(){
					this.actorsDone += 1
					if(this.actorsDone == amountOfActors){
						this.benchEnd()
					}
				}
			}

			var actorBehaviour = {

				init: function(){
					this.system.actorInit()
				},

				calc: function(theta){
					var sint 	= Math.sin(theta)
					var res 	= sint * sint
				},

				newMessage: function(){
					this.calc(37.2)
					this.system.actorDone()
				}
			}


			systemActor(sysBehaviour)
			actors = []
			var count = amountOfActors
			while(count > 0){
				var newActor = actor(actorBehaviour)
				actors.push(newActor)
				count -= 1
			}
		},true)
	}

	return function(configs,startCB){
		var amActors = configs[0]
		construct(amActors,startCB)
	}
})