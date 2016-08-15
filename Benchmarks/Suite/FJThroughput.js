define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfActors,amountOfMessages,configCallback){
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
									actors[i].newMessage(true)
								}
								for(var i in actors){
									var next = actors[i]
									for(var i = 0;i < amountOfMessages;i++){
										next.newMessage(false)
									}
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
				totalAmMess: 	null,
				currentAmMess: 	null,

				config: function(amMess){
					this.totalAmMess 	= amMess
					this.currentAmMess 	= 0
					this.system.actorInit()
				},

				calc: function(theta){
					var sint 	= Math.sin(theta)
					var res 	= sint * sint
				},

				newMessage: function(fresh){
					if(fresh){
						this.currentAmMess = 0
					}
					else{
						this.currentAmMess += 1
						this.calc(37.2)
						if(this.currentAmMess == this.totalAmMess){
							this.system.actorDone()
						}
					}
				}
			}


			systemActor(sysBehaviour)
			actors = []
			var count = amountOfActors
			while(count > 0){
				var newActor = actor(actorBehaviour)
				actors.push(newActor)
				newActor.config(amountOfMessages)
				count -= 1
			}
		},true)
	}

	return function(configs,startCB){
		var amActors = configs[0]
		var amMess = configs[1]
		construct(amActors,amMess,startCB)
	}
})