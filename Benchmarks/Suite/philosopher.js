define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfPhilosophers,amountOfEatRounds,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == amountOfPhilosophers + 1){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								for(var i in philosophers){
									philosophers[i].start()
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

				end: function(){
					this.benchEnd()
				}
			}

			var philosopherBehaviour = {
				waiterRef: 		null,
				id: 			null,
				totalRounds: 	null,
				doneRounds: 	0,

				init: function(){
					var fut = this.system.getRef("waiter")
					this.onResolve(fut,function(waiterRef){
						this.waiterRef = waiterRef
					})
				},

				config: function(id,totalRounds){
					this.id 		= id
					this.totalRounds = totalRounds
					this.system.actorInit() 
				},

				start: function(){
					this.waiterRef.hungry(this,this.id)
				},

				denied: function(){
					this.waiterRef.hungry(this,this.id)
				},

				eating: function(){
					this.doneRounds += 1
					this.waiterRef.done(this.id)
					if(this.doneRounds == this.totalRounds){
						this.waiterRef.philExit()
					}
					else{
						this.waiterRef.hungry(this,this.id)
					}
				}

			}

			var waiterBehaviour = {
				forks: 					[],
				totalPhilosophers: 		0,
				stoppedPhilosophers: 	0,

				config: function(totalPhilosophers){
					this.totalPhilosophers = totalPhilosophers
					for(var i = 0;i < this.totalPhilosophers;i++){
						this.forks[i] = true
					}
					this.system.actorInit()
				},

				hungry: function(phil,id){
					var leftFork = this.forks[id]
					var rightFork = this.forks[(id + 1) % this.forks.length]
					if(leftFork && rightFork){
						this.forks[id] = false
						this.forks[(id + 1) % this.forks.length] = false
						phil.eating()
					}
					else{
						phil.denied()
					}
				},

				done: function(id){
					this.forks[id] = true
					this.forks[(id + 1) % this.forks.length] = true
				},

				philExit: function(){
					this.stoppedPhilosophers += 1
					if(this.stoppedPhilosophers == this.totalPhilosophers){
						this.system.end()
					}
				}

			}


			systemActor(sysBehaviour)
			var waiterRef = actor(waiterBehaviour,"waiter")
			waiterRef.config(amountOfPhilosophers)
			philosophers = []
			var philCount = amountOfPhilosophers - 1
			while(philCount >= 0){
				var newPhil = actor(philosopherBehaviour)
				newPhil.config(philCount,amountOfEatRounds)
				philosophers.push(newPhil)
				philCount -= 1
			}
		},true)
	}

	return function(configs,startCB){
		var amPhilo 	= configs[0]
		var amEat 		= configs[1]
		construct(amPhilo,amEat,startCB)
	}
})