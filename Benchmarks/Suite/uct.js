define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(maxNodes,avgComp,stdComp,binomial,percent,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsExited: 		0,
				benchEnd: 			null,
				totalSpawned: 		1,
				totalEnded: 		0,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == 1){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								rootRef.generateTree()
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
				},

				spawnNode: function(parent,root,height,id,comp,urgent){
					var nodeRef = actor(nodeBehaviour)
					nodeRef.config(parent,root,height,id,comp,urgent,binomial)
					this.totalSpawned += 1
					return nodeRef
				},

				endNode: function(id){
					this.totalEnded += 1
					if(this.totalEnded == this.totalSpawned){
						this.end()
					}
				}

			}


			var rootBehaviour = {
				maxNodes: 			null,
				avgComp: 			null,
				stdComp: 			null,
				binomial: 			null,
				percent: 			null,
				height: 			1,
				size: 				1,
				children: 			[],
				hasGrantChildren:	[],
				traversed: 			false,
				terminated:  		false,

				config: function(maxNodes,avgComp,stdComp,binomial,percent){
					this.maxNodes 	= maxNodes
					this.avgComp 	= avgComp
					this.stdComp 	= stdComp
					this.binomial	= binomial
					this.percent	= percent
					this.system.actorInit()
				},

				getNextNormal: function(avg,stdev){
					var result = 0
					while(result <= 0){
						var temp = Math.random() * ((100 - 0) + 0) * stdev + avg;
						result = Math.round(temp)
					}
					return result
				},

				generateTree: function(){
					this.height += 1
					var compSize = this.getNextNormal(this.avgComp,this.stdComp)
					var i = 0
					while(i < this.binomial){
						this.hasGrantChildren[i] = false
						var fut = this.system.spawnNode(this,this,this.height,this.size + 1,compSize,false)
						this.onResolve(fut,function(ref){
							this.children.push(ref)
							ref.tryGenerate()
						})
						i += 1
					}
					this.size += this.binomial
				},

				traverse: function(){
					for(var i in this.children){
						this.children[i].traverse()
					}
				},

				shouldGenerateChildren: function(childRef,childHeight){
					if(this.size + this.binomial <= this.maxNodes){
						var moreChildren = Math.floor(Math.random() * (2 - 0) + 0)
						if(moreChildren == 1){
							var childComp = this.getNextNormal(this.avgComp,this.stdComp)
							var randomInt = Math.floor(Math.random() * (100 - 0) + 0)
							if(randomInt > this.percent){
								childRef.generateChildren(this.size,childComp)
							}
							else{
								childRef.generateUrgentChildren(Math.round(Math.random() * (this.binomial - 0) + 0),this.size,childComp)
							}
							this.size += this.binomial
							if(childHeight + 1 > this.height){
								this.height += childHeight + 1
							}
						}
						else{
							if(childHeight > this.height){
								this.height = childHeight
							}
						}
					}
					else{
						if(!this.traversed){
							this.traversed = true
							this.traverse()
						}
						this.terminate()
					}
				},

				updateGrant: function(id){
					this.hasGrantChildren[id] = true
				},

				terminate: function(){
					if(!this.terminated){
						for(var i in this.children){
							this.children[i].terminate()
						}
						this.system.endNode("root")
						this.terminated = true
					}
				}

			}

			var nodeBehaviour = {
				parent: 			null,
				root: 				null,
				height: 			null,
				id: 				null,
				comp: 				null,
				urgent: 			null,
				binomial: 			null,
				children: 			[],
				hasGrantChildren: 	[], 
				hasChildren: 		false,
				urgentChild: 		null,
				inTermination: 		false,

				config: function(parent,root,height,id,comp,urgent,binomial){
					this.parent 	= parent
					this.root 		= root
					this.height 	= height
					this.id 		= id
					this.comp 		= comp
					this.urgent 	= urgent
					this.binomial 	= binomial 
				},

				loop: function(busywait,dummy){
					var test = 0;
					for (var k = 0; k < dummy * busywait; k++) {
					    test += 1;
					}
					return test;
				},

				tryGenerate: function(){
					this.loop(100,40000)
					this.root.shouldGenerateChildren(this,this.height)
				},

				generateChildren: function(currentId,compSize){
					var myArrayId 		= this.id % this.binomial
					this.parent.updateGrant(myArrayId)
					var childrenHeight 	= this.height + 1
					var idValue 		=  currentId
					var i 				= 0
					while(i < this.binomial){
						var fut  = this.system.spawnNode(this,this.root,childrenHeight,idValue + i,compSize,false)
						this.onResolve(fut,function(ref){
							this.children.push(ref)
							ref.tryGenerate()
							if(this.inTermination){
								ref.terminate()
							}
						})
						i += 1
					}
					this.hasChildren = true
				},

				generateUrgentChildren: function(urgentChildId, currentId, compSize){
					var myArrayId = this.id % this.binomial
					this.parent.updateGrant(myArrayId)
					var childrenHeight = this.height + 1
					var idValue = currentId
					this.urgentChild = urgentChildId
					var i = 0
					while(i < this.binomial){
						var fut = this.system.spawnNode(this,this.root,childrenHeight,idValue + i,compSize,i == urgentChildId)
						this.onResolve(fut,function(ref){
							this.children.push(ref)
							ref.tryGenerate()
							if(this.inTermination){
								ref.terminate()
							}
						})
						i += 1
					}
					this.hasChildren = true
				},

				updateGrant: function(id){
					this.hasGrantChildren[id] = true
				},

				traverse: function(){
					this.loop(this.comp,40000)
					if(this.hasChildren){
						for(var i in this.children){
							this.children[i].traverse()
						}
					}
				},

				terminate: function(){
					if(this.hasChildren){
						for(var i in this.children){
							this.children[i].terminate()
						}
					}
					this.inTermination = true
					this.system.endNode(this.id)
				}

			}





			systemActor(sysBehaviour)
			var rootRef = actor(rootBehaviour)
			rootRef.config(maxNodes,avgComp,stdComp,binomial,percent)
		},true)
	}

	return function(configs,startCB){
		var maxNodes 	= configs[0]
		var avgComp 	= configs[1]
		var stdComp 	= configs[2]
		var binomial 	= configs[3]
		var percent 	= configs[4]
		construct(maxNodes,avgComp,stdComp,binomial,percent,startCB)
	}
})