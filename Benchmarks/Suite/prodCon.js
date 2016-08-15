define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(bufferSize,amountOfProducers,amountOfConsumers,amountOfItems,prodCost,conCost,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == amountOfProducers + amountOfConsumers + 1){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								for(var i in producers){
									producers[i].produce()
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

			var managerBehaviour = {
				allConsumers: 		[],
				availableConsumers: [],
				availableProducers: [],
				totalConsumers: 	0,
				totalProducers: 	0,
				adjustBuffer: 		0,
				producersStopped: 	0,
				pendingData: 		[],

				config: function(bufferSize,totalConsumers,totalProducers){
					this.totalConsumers = totalConsumers
					this.totalProducers = totalProducers
					this.adjustBuffer = bufferSize - totalProducers
				},

				registerConsumer: function(consumerRef){
					this.availableConsumers.push(consumerRef)
					if(this.availableConsumers.length == this.totalConsumers){
						this.system.actorInit()
					}
				},

				newDataProduced: function(producer,item){
					if(this.availableConsumers.length == 0){
						this.pendingData.push(item)
					}
					else{
						var consumer = this.availableConsumers.pop()
						consumer.consume(item)
					}
					if(this.pendingData.length >= this.adjustBuffer){
						this.availableProducers.push(producer)
					}
					else{
						producer.produce()
					}
				},

				consumerAvailable: function(consumer){
					if(this.pendingData.length == 0){
						this.availableConsumers.push(consumer)
						this.tryExit()
					}
					else{
						var data = this.pendingData.pop()
						consumer.consume(data)
						if(!(this.availableProducers.length == 0)){
							var producer = this.availableProducers.pop()
							producer.produce()
						}
					}
				},

				producerStopped: function(){
					this.producersStopped += 1
					this.tryExit()
				},

				tryExit: function(){
					if(this.producersStopped == this.totalProducers && this.availableConsumers.length == this.totalConsumers){
						this.system.end()
					}
				}


			}


			var producerBehaviour = {
				managerRef: 	null,
				prodItem: 		0.0,
				totalItems: 	0,
				currentItems: 	0,
				prodCost: 		0,
				stopped: 		false,

				init: function(){
					var fut = this.system.getRef("manager")
					this.onResolve(fut,function(managerRef){
						this.managerRef = managerRef
					})
				},

				config: function(totalItems,prodCost){
					this.totalItems = totalItems
					this.prodCost 	= prodCost
					this.system.actorInit()
				},

				getRandom: function(upper){
					return Math.floor(Math.random() * (upper - 0 + 1)) + 0;
				},

				processItem: function(item,cost){
					var result 	= item
					var rand 	= this.getRandom(cost)
					if(cost > 0){
						for(var i = 0;i < cost;i++){
							for(var j = 0;j < 100;j++){
								result += Math.log(Math.abs(this.getRandom(100)) + 0.01)
							}
						}
					}
					else{
						result += Math.log(Math.abs(this.getRandom(100)) + 0.01)
					}
					return result
				},

				produce: function(){
					if(!(this.stopped)){
						if(this.currentItems == this.totalItems){
							this.managerRef.producerStopped()
							this.stopped = true
						}
						else{
							this.prodItem = this.processItem(this.prodItem,this.prodCost)
							this.managerRef.newDataProduced(this,this.prodItem)
							this.currentItems += 1
						}
					}
				}

			}

			var consumerBehaviour = {
				managerRef: null,
				conCost: 	0,
				conItem: 	0,

				init: function(){
					var fut = this.system.getRef("manager")
					this.onResolve(fut,function(managerRef){
						this.managerRef = managerRef
					})
				},

				config: function(conCost){
					this.conCost = conCost
					this.system.actorInit()
				},

				getRandom: function(upper){
					return Math.floor(Math.random() * (upper - 0 + 1)) + 0;
				},

				processItem: function(item,cost){
					var result 	= item
					var rand 	= this.getRandom(cost)
					if(cost > 0){
						for(var i = 0;i < cost;i++){
							for(var j = 0;j < 100;j++){
								result += Math.log(Math.abs(this.getRandom(100)) + 0.01)
							}
						}
					}
					else{
						result += Math.log(Math.abs(this.getRandom(100)) + 0.01)
					}
				},

				consume: function(item){
					this.conItem = this.processItem(this.conItem + item, this.conCost)
					this.managerRef.consumerAvailable(this)
				}

			}


			systemActor(sysBehaviour)
			var managerRef = actor(managerBehaviour,"manager")
			managerRef.config(bufferSize,amountOfConsumers,amountOfProducers)
			producers = []
			var prodCount = amountOfProducers
			while(prodCount > 0){
				var newProd = actor(producerBehaviour)
				newProd.config(amountOfItems,prodCost)
				producers.push(newProd)
				prodCount -= 1
			}
			consumers = []
			var conCount = amountOfConsumers
			while(conCount > 0){
				var newCon = actor(consumerBehaviour)
				newCon.config(conCost)
				managerRef.registerConsumer(newCon)
				consumers.push(newCon)
				conCount -= 1
			}
		},true)
	}

	return function(configs,startCB){
		var bufferSize 	= configs[0]
		var amProd 		= configs[1]
		var amCon 		= configs[2]
		var amItems		= configs[3]
		var prodCost 	= configs[4]
		var conCost 	= configs[5]
		construct(bufferSize,amProd,amCon,amItems,prodCost,conCost,startCB)
	}
})