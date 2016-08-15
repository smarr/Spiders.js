define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(numPoints,gridSize,F,alpha,cutOff,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsExited: 		0,
				benchEnd: 			null,
				totalSpawned: 		2,
				totalEnded: 		0,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == 2){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								prodRef.produceConsumer()
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
					if(this.actorsExited == this.totalSpawned){
						this.benchEnd()
					}
				},

				end: function(){
					this.benchEnd()
				},

				spawnQuad: function(parent,positionToParent,bx1,by1,bx2,by2,threshold,depth,initKnownFacilities,initMaxDepthOpenFac){
					var ref = actor(quadrantBehaviour)
					ref.config(false,parent,positionToParent,bx1,by1,bx2,by2,threshold,depth,initKnownFacilities,initMaxDepthOpenFac)
					this.totalSpawned += 1
					return ref
				}
			}

			var producerBehaviour = {
				quadRef: 		null,
				gridSize: 		null,
				numPoints: 		null,
				itemsProduced: 	0,

				makePoint: function(xVal,yVal){
					return this.isolate({
						x: xVal,
						y: yVal,
					})
				},

				getRand: function(upper,lower){
					return Math.floor(Math.random() * (upper - lower) + lower)
				},

				config: function(quadRef,gridSize,numPoints){
					this.quadRef 	= quadRef
					this.gridSize 	= gridSize
					this.numPoints 	= numPoints
					this.system.actorInit()
				},

				produceConsumer: function(){
					var xVal 	= this.getRand(this.gridSize,0)
					var yVal 	= this.getRand(this.gridSize,0)
					var point 	= this.makePoint(xVal,yVal)
					this.quadRef.customerMsg(this,point)
					this.itemsProduced += 1	 
				},

				nextCustomerMsg: function(){
					if(this.itemsProduced < this.numPoints){
						this.produceConsumer()
					}
					else{
						this.quadRef.requestExit()
						this.system.actorExit()
					}
				}
			}

			var quadrantBehaviour = {
				parent: 				null,
				positionToParent: 		null,
				boundary: 				null,
				threshold: 				null,
				depth:  				null,
				initLocalFacilities: 	null,
				initKnownFacilities: 	null,
				initMaxDepthOpenFac: 	null,
				initCustomers: 			null,
				
				facility: 				null,
				localFacilities: 		[],
				supportCustomers: 		[],
				knownFacilities: 		null,
				maxDepthOpenFac: 		null,
				terminatedChildCount: 	0,
				childrenFacilities: 	0,
				facilityCustomers: 		0,
				// null when closed, non-null when open
				children: 				null,
				childrenBoundaries: 	null,
				childrenSpawned: 		0,
				totalCost: 				0.0,

				makePoint: function(xVal,yVal){
					return this.isolate({
						x: xVal,
						y: yVal,
						getDistance: function(p){
							var xDiff = p.x - this.x
							var yDiff = p.y - this.y 
							var distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff))
							return distance
						}
					})
				},

				makeBoundary: function(bx1,by1,bx2,by2){
					var that = this
					return this.isolate({
						x1: bx1,
						x2: bx2,
						y1: by1,
						y2: by2,
						midPoint: function(){
							var xVal = (this.x1 + this.x2) / 2
							var yVal = (this.y1 + this.y2) / 2
							return that.makePoint(xVal,yVal)
						},
						contains: function(point){
							return this.x1 <= point.x && this.y1 <= point.y && point.x <= this.x2 && point.y <= this.y2
						}
					})
				},

				config: function(parentNull,parent,positionToParent,bx1,by1,bx2,by2,threshold,depth,initKnownFacilities,initMaxDepthOpenFac){
					if(parentNull){
						this.parent = null
					}
					else {
						this.parent = parent
					}
					this.positionToParent 		= positionToParent
					this.boundary 				= this.makeBoundary(bx1,by1,bx2,by2)
					this.threshold 				= threshold
					this.depth 					= depth
					this.initKnownFacilities 	= initKnownFacilities
					this.initMaxDepthOpenFac 	= initMaxDepthOpenFac
					this.initLocalFacilities 	= []
					this.initCustomers 			= []
					this.facility 				= this.boundary.midPoint()
					this.knownFacilities 		= this.initKnownFacilities
					this.maxDepthOpenFac 		= this.initMaxDepthOpenFac
				},

				copyInitFacility: function(xVal,yVal){
					var facility = this.makePoint(xVal,yVal)
					this.newInitFacility(facility)
				},

				newInitFacility: function(facility){
					if(this.initLocalFacilities == null){
						var that = this
						setTimeout(function(){
							that.newInitFacility(facility)
						},200)
					}
					else{
						this.initLocalFacilities.push(facility)
					}
				},

				newInitCustomer: function(customer){
					if(this.initCustomers == null){
						var that = this
						setTimeout(function(){
							that.newInitCustomer(customer)
						},200)
					}
					else{
						this.initCustomers.push(customer)
					}
				},

				configDone: function(){
					//Could be that config isn't done yet (called by other actor for instance)
					if(this.initCustomers == null){
						var that = this
						setTimeout(function(){
							that.configDone()
						},200)
					}
					else{
						this.system.actorInit()
						for(var i in this.initLocalFacilities){
							this.localFacilities.push(this.initLocalFacilities[i])
						}
						this.localFacilities.push(this.facility)
						for(var i in this.initCustomers){
							var loopPoint = this.initCustomers[i]
							if(this.boundary.contains(loopPoint)){
								this.addCustomer(loopPoint)
							}
						}
					}
				},

				addCustomer: function(point){
					this.supportCustomers.push(point)
					var minCost = this.findCost(point)
					this.totalCost += minCost
				},

				findCost: function(point){
					//No max val in JS
					var result = 100000000000
					for(var i in this.localFacilities){
						var loopPoint 	= this.localFacilities[i]
						var distance 	= loopPoint.getDistance(point)
						if(distance < result){
							result = distance
						}
					}
					return result
				},

				childSpawned: function(){
					this.childrenSpawned += 1
				},

				customerMsg: function(sender,point){
					if(this.children == null){
						this.addCustomer(point)
						if(this.totalCost > this.threshold){
							this.partition()
						}
					}
					else{
						if((this.childrenBoundaries.length == 4) && (this.childSpawned == 4)){
							var index = 0
							while(index <= 3){
								var loopChildBoundary = this.childrenBoundaries[index]
								if(loopChildBoundary.contains(point)){
									this.children[index].customerMsg(sender,point)
									index = 4
								}
								else{
									index += 1
								}
							}
						}
						else{
							var that = this
							setTimeout(function(){
								that.customerMsg(sender,point)
							},200)
						}
					}
					if(this.parent == null){
						sender.nextCustomerMsg()
					}
				},

				facilityMsg : function(posToParent,depth,point,bool){
					this.knownFacilities += 1
					this.localFacilities.push(point)
					if(bool){
						this.notifyParentOfFacility(point,depth)
						if(depth > this.maxDepthOpenFac){
							this.maxDepthOpenFac = depth
						}
						var childPos 	= posToParent
						var sibling 	= null
						if(childPos == "TOP_LEFT"){
							sibling = this.children[3]
						}
						else if(childPos == "TOP_RIGHT"){
							sibling = this.children[2]
						}
						else if(childPos == "BOT_RIGHT"){
							sibling = this.children[0]
						}
						else {
							sibling = this.children[1]
						}
						sibling.facilityMsg("UNKNOWN",depth,point,false)
					}
					else{
						if(this.children != null){
							for(var i in this.children){
								this.children[i].facilityMsg("UNKNOWN",depth,point,false)
							}
						}
					}
				},

				notifyParentOfFacility: function(point,depth){
					if(this.parent != null){
						this.parent.facilityMsg(this.positionToParent,depth,point,true)
					}
				},

				partition: function(){
					this.children = []
					this.childrenBoundaries = []
					this.notifyParentOfFacility(this.facility,this.depth)
					this.maxDepthOpenFac 	= Math.max(this.maxDepthOpenFac,this.depth)
					var firstBoundary 		= this.makeBoundary(this.boundary.x1,this.facility.y,this.facility.x,this.boundary.y2)
					var secondBoundary 		= this.makeBoundary(this.facility.x,this.facility.y,this.boundary.x2,this.boundary.y2)
					var thirdBoundary 		= this.makeBoundary(this.boundary.x1,this.boundary.y1,this.facility.x,this.facility.y)
					var fourthBoundary 		= this.makeBoundary(this.facility.x,this.boundary.y1,this.boundary.x2,this.facility.y)
					var customers1 			= []
					for(var i in this.supportCustomers){
						customers1.push(this.supportCustomers[i])
					}
					var fut1 				= this.system.spawnQuad(this,"TOP_LEFT",firstBoundary.x1,firstBoundary.y1,firstBoundary.x2,firstBoundary.y2,this.threshold,this.depth + 1,this.knownFacilities,this.maxDepthOpenFac)
					this.onResolve(fut1,function(ref){
						for(var i in this.localFacilities){
							ref.copyInitFacility(this.localFacilities[i].x,this.localFacilities[i].y)
						}
						for(var i in customers1){
							ref.newInitCustomer(customers1[i])
						}
						this.children[0] = ref
						this.childrenBoundaries[0] = firstBoundary
						var f = ref.configDone()
						this.onResolve(f,function(dc){
							this.childSpawned()
						})
					})
					var customers2 			= []
					for(var i in this.supportCustomers){
						customers2.push(this.supportCustomers[i])
					}
					var fut2 				= this.system.spawnQuad(this,"TOP_RIGHT",secondBoundary.x1,secondBoundary.y1,secondBoundary.x2,secondBoundary.y2,this.threshold,this.depth + 1,this.knownFacilities,this.maxDepthOpenFac)
					this.onResolve(fut2,function(ref){
						for(var i in this.localFacilities){
							ref.copyInitFacility(this.localFacilities[i].x,this.localFacilities[i].y)
						}
						for(var i in customers2){
							ref.newInitCustomer(customers2[i])
						}
						this.children[1] = ref
						this.childrenBoundaries[1] = secondBoundary
						var f = ref.configDone()
						this.onResolve(f,function(dc){
							this.childSpawned()
						})
					})
					var customers3			= []
					for(var i in this.supportCustomers){
						customers3.push(this.supportCustomers[i])
					}
					var fut3 				= this.system.spawnQuad(this,"BOT_LEFT",thirdBoundary.x1,thirdBoundary.y1,thirdBoundary.x2,thirdBoundary.y2,this.threshold,this.depth + 1,this.knownFacilities,this.maxDepthOpenFac)
					this.onResolve(fut3,function(ref){
						for(var i in this.localFacilities){
							ref.copyInitFacility(this.localFacilities[i].x,this.localFacilities[i].y)
						}
						for(var i in customers3){
							ref.newInitCustomer(customers3[i])
						}
						this.children[2] = ref
						this.childrenBoundaries[2] = thirdBoundary
						var f = ref.configDone()
						this.onResolve(f,function(dc){
							this.childSpawned()
						})
					})
					var customers4			= []
					for(var i in this.supportCustomers){
						customers4.push(this.supportCustomers[i])
					}
					var fut4 				= this.system.spawnQuad(this,"BOT_RIGHT",fourthBoundary.x1,fourthBoundary.y1,fourthBoundary.x2,fourthBoundary.y2,this.threshold,this.depth + 1,this.knownFacilities,this.maxDepthOpenFac)
					this.onResolve(fut4,function(ref){
						for(var i in this.localFacilities){
							ref.copyInitFacility(this.localFacilities[i].x,this.localFacilities[i].y)
						}
						for(var i in customers4){
							ref.newInitCustomer(customers4[i])
						}
						this.children[3] = ref
						this.childrenBoundaries[3] = fourthBoundary
						var f = ref.configDone()
						this.onResolve(f,function(dc){
							this.childSpawned()
						})
					})
					this.supportCustomers = []
				},

				requestExit: function(){
					if(this.children != null){
						for(var i in this.children){
							this.children[i].requestExit()
						}
					}
					else{
						this.safelyExit()
					}
				},

				confirmExit: function(){
					this.terminatedChildCount += 1
					if(this.terminatedChildCount == 4){
						this.safelyExit()
					}
				},

				safelyExit: function(){
					if(this.parent != null){
						var numFacilities = 0
						if(this.children != null){
							numFacilities = this.childrenFacilities + 1
						}
						else{
							numFacilities = this.childrenFacilities
						}
						var numCustomers = this.facilityCustomers + this.supportCustomers.length
						this.parent.confirmExit()
					}
					else{
						var numFacilities = this.childrenFacilities + 1
					}
					this.system.actorExit()
				}

			}

			systemActor(sysBehaviour)
			var threshold 	= alpha * F
			var quadRef 	= actor(quadrantBehaviour)
			quadRef.config(true,0,"ROOT",0,0,gridSize,gridSize,threshold,0,1,-1)
			quadRef.configDone()
			var prodRef 	= actor(producerBehaviour)
			prodRef.config(quadRef,gridSize,numPoints)
		},true)
	}

	return function(configs,startCB){
		var numPoints 	= configs[0]
		var gridSize 	= configs[1]
		var F 			= configs[2]
		var alpha 		= configs[3]
		var cutOff 		= configs[4]
		construct(numPoints,gridSize,F,alpha,cutOff,startCB)
	}
})