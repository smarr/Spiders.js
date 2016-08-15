define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfActors,amountOfMessages,amountOfWrite,amountOfSize,configCallback){
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
									actors[i].config(amountOfWrite,amountOfSize,amountOfMessages)
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

			var linkedListBehaviour = {
				listHead: null,

				init: function(){
					this.system.actorInit()
				},

				newNode: function(item){
					return {item: item,next: null}
				},

				addNode: function(item){
					var node = this.newNode(item)
					if(this.listHead == null){
						this.listHead = node
					}
					else if(item < this.listHead.item){
						node.next = this.listHead
						this.listHead = node
					}
					else{
						var after = this.listHead.next
						var before = this.listHead
						while(after != null){
							if(item  < after.item){
								break
							}
							before = after
							after = after.next
						}
						node.next = before.next
						before.next = node
					}

				},

				contains: function(item){
					var n = this.listHead
					while(n != null){
						if(item < n.item){
							return true
						}
						n = n.next
					}
					return false
				},

				size: function(){
					var total = 0
					var n = this.listHead
					while(n != null){
						total += 1
						n = n.next
					}
					return total
				},

				read: function(sender){
					var length = this.size()
					sender.work()
				},

				write: function(sender,value){
					this.addNode(value)
					sender.work()
				},

				cont: function(sender,value){
					var res = this.contains(value)
					sender.work()
				}

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
				listRef: 		 null,
				writePercentage: 0,
				sizePercentage:  0,
				totalMsgs: 		 0,
				currentMsgs: 	 0,

				init: function(){
					var fut = this.system.getRef("master")
					this.onResolve(fut,function(masterRef){
						this.masterRef = masterRef
						var fut2 = this.system.getRef("linkedList")
						this.onResolve(fut2,function(listRef){
							this.listRef = listRef
							this.system.actorInit()
						})
					})
				},

				config: function(writePercentage,sizePercentage,totalMsgs){
					this.writePercentage 	= writePercentage
					this.sizePercentage 	= sizePercentage
					this.totalMsgs			= totalMsgs
				},

				getRandom: function(){
					return Math.floor(Math.random() * (100 - 0 + 1)) + 0;
				},

				work: function(){
					this.currentMsgs += 1
					if(this.currentMsgs <= this.totalMsgs){
						var rand = this.getRandom()
						if(rand < this.sizePercentage){
							this.listRef.read(this)
						}
						else if(rand < this.writePercentage){
							var item = this.getRandom()
							this.listRef.write(this,item)
						}
						else{
							var item = this.getRandom()
							this.listRef.cont(this,item)
						}
					}
					else{
						this.masterRef.workerDone()
					}
				}
			}

			



			systemActor(sysBehaviour)
			var masterRef = actor(masterBehaviour,"master")
			masterRef.config(amountOfActors)
			actor(linkedListBehaviour,"linkedList")
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
		var amSize 		= configs[3]
		construct(amActors,amMsg,amWrite,amSize,startCB)
	}
})