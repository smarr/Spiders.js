define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfActors,amountOfMeetings,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				meetingsToHold: 	amountOfMeetings,
				numFaded: 			0,
				sumMeetings: 		0,
				waitingCham: 		null,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == amountOfActors){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								for(var i in actors){
									actors[i].startGame()
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

				meetCount: function(count){
					this.numFaded += 1
					this.sumMeetings = this.sumMeetings + count
					if(this.numFaded == amountOfActors){
						this.benchEnd()
					}
				},

				meet: function(sender,color){
					if(this.meetingsToHold > 0){
						if(this.waitingCham == null){
							this.waitingCham = sender
						}
						else{
							this.meetingsToHold -= 1
							this.waitingCham.meet(sender,color)
							this.waitingCham = null
						}
					}
					else{
						sender.exitGame()
					}
				}

			}

			var actorBehaviour = {
				meetingsHeld: 0,
				color: 	null,

				config: function(color){
					this.color = color
					this.system.actorInit()
				},

				startGame: function(){
					this.system.meet(this,this.color)
				},

				exitGame: function(){
					this.color = -1
					this.system.meetCount(this.meetingsHeld)
				},

				meet: function(sender,otherColor){
					this.color = this.complement(otherColor)
					this.meetingsHeld += 1
					sender.changeColor(this.color)
					this.system.meet(this,this.color)
				},

				changeColor: function(color){
					this.color = color
					this.meetingsHeld += 1
					this.system.meet(this,this.color)
				},

				//Doesn't make a lot of sense, but doesn't really matter for benchmark anyway 
				complement: function(otherColor){
					switch(this.color){
						case -1: return -1;
						case 0:
							switch(otherColor){
								case 1: return 2;
								case 2: return 1;
								case 0: return 0;
								case -1: return -1;
							};
						case 1:
							switch(otherColor){
								case 1: return 1;
								case 2: return 0;
								case 0: return 2;
								case -1: return -1;
							}
						case 2:
							switch(otherColor){
								case 1: return 0;
								case 2: return 2;
								case 0: return 1;
								case -1: return -1;
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
				count -= 1
			}
			//Faded color = -1
			//blue = 0
			//red = 1
			//yellow = 2
			for(var i in actors){
				var next = actors[i]
				next.config(i % 3)
			}
		},true)
	}

	return function(configs,startCB){
		var amActors 	= configs[0]
		var amMeetings 	= configs[1]
		construct(amActors,amMeetings,startCB)
	}
})