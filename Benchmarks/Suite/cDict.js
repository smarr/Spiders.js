define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfActors,amountOfMessages,amountOfWrite,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					//+ 2 for dictionary and master
					if(this.actorsInitialised == amountOfActors + 2){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								for(var i in actors){
									actors[i].config(amountOfWrite,amountOfMessages)
									actors[i].work()
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

			var dictionaryBehaviour = {
				data: {},

				init: function(){
					this.system.actorInit()
				},

				write: function(sender,key,val){
					this.data[key] = val
					sender.work()
				},

				read: function(sender,key){
					var val = this.data[key]
					sender.work()
				},

			}

			var masterBehaviour = {
				totalWorkers: 	0,
				workersDone: 	0,

				init: function(){
					this.system.actorInit()
				},

				config: function(totalWorkers){
					this.totalWorkers = totalWorkers
				},

				workerDone: function(){
					this.workersDone += 1
					if(this.workersDone == this.totalWorkers){
						this.system.end()
					}
				}

			}

			var workerBehaviour = {
				masterRef: 		 null,
				dictRef: 		 null,
				writePercentage: 0,
				totalMsgs: 		 0,
				currentMsgs: 	 0,

				init: function(){
					var fut = this.system.getRef("master")
					this.onResolve(fut,function(masterRef){
						this.masterRef = masterRef
						var fut2 = this.system.getRef("dictionary")
						this.onResolve(fut2,function(dictRef){
							this.dictRef = dictRef
							this.system.actorInit()
						})
					})
				},

				config: function(writePercentage,totalMsgs){
					this.writePercentage 	= writePercentage
					this.totalMsgs			= totalMsgs
				},

				getRandom: function(){
					return Math.floor(Math.random() * (100 - 0 + 1)) + 0;
				},

				work: function(){
					this.currentMsgs += 1
					if(this.currentMsgs <= this.totalMsgs){
						var rand = this.getRandom()
						if(rand < this.writePercentage){
							var key = this.getRandom()
							var val = this.getRandom()
							this.dictRef.write(this,key,val)
						}
						else{
							var key = this.getRandom()
							this.dictRef.read(this,key)
						}
					}
					else{
						this.masterRef.workerDone()
					}
				}

			}



			systemActor(sysBehaviour)
			actor(dictionaryBehaviour,"dictionary")
			var masterRef = actor(masterBehaviour,"master")
			masterRef.config(amountOfActors)
			actors = []
			var count = amountOfActors
			while(count > 0){
				var newActor = actor(workerBehaviour)
				actors.push(newActor)
				count -= 1
			}
		},true)
	}

	return function(configs,startCB){
		var amActors 	= configs[0]
		var amMsg 		= configs[1]
		var amWrite 	= configs[2]
		construct(amActors,amMsg,amWrite,startCB)
	}
})