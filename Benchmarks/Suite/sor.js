define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(refVal,dataSizes,jacobi,omega,N,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsExited: 		0,
				benchEnd: 			null,
				totalEnded: 		0,
				totalSpawned: 		1,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == 1){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								runnerRef.boot()
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

				spawnSorActor: function(pos,value,color,nx,ny,omega,sorSource,peer){
					var actRef = actor(sorActorBehaviour)
					actRef.config(pos,value,color,nx,ny,omega,sorSource,peer)
					this.totalSpawned += 1
					return actRef
				},

				spawnSorPeer: function(s,partStart,matrix,sorSource){
					var peerRef = actor(sorPeerBehaviour)
					peerRef.config(omega,jacobi,s,partStart,matrix,sorSource)
					this.totalSpawned += 1
					return peerRef
				}
			}

			var sorRunnerBehaviour = {
				n: 					null,
				s: 					null,
				omega: 				null,
				jacobi: 			null, 
				part: 				null,
				sorActors: 			[],
				gTotal: 			0.0,
				returned: 			0,
				totalMsgRcv: 		0,
				expectingBoot: 		true,
				sorActorsSpawned: 	0,
				sorActorsRec: 		0,
				mBorder: 			[],
				myBorder: 			[],

				config: function(n,s,omega,jacobi){
					this.n 		= n
					this.s 		= s
					this.omega 	= omega
					this.jacobi = jacobi
					this.part 	= Math.floor(s / 2)
					this.system.actorInit()
				},

				genRandomMatrix: function(M,N){
					var A = {}
					for(var i = 0;i < M;i++){
						A[i] = {}
						for(var j = 0;j < N;j++){
							A[i][j] = (Math.random() * (100 - 0) + 0) * 1e-6
						}
					}
					return A
				},

				boot: function(){
					this.myBorder 	= []
					var randoms 	= this.genRandomMatrix(this.s,this.s)
					var that = this
					function outerLoop(i){
						if(i < that.s){
							var c = i % 2
							function innerLoop(j){
								if(j < that.part){
									var pos = i * (that.part + 1) + j
									c = 1 - c
									var fut = that.system.spawnSorActor(pos,randoms[i][j],c,that.s,that.part + 1,that.omega,that,false)
									that.sorActorsSpawned += 1
									that.onResolve(fut,function(ref){
										that.sorActors[pos] = ref
										that.sorActorsRec += 1
										if(j == (that.part - 1)){
											that.myBorder[i] = ref
										}
									})
									innerLoop(j + 1)
								}
							}
							innerLoop(0)
							outerLoop(i + 1)
						}
					}
					outerLoop(0)
					var partialMatrix = {}
					for(var i = 0;i < this.s;i++){
						partialMatrix[i] = {}
						for(var j = 0;j < this.s - this.part ;j++){
							partialMatrix[i][j] = randoms[i][j + this.part]
						}
					}
					var isolMatrix = this.isolate(partialMatrix)
					var that = this
					function waitForBorder(){
						if(that.sorActorsSpawned == that.sorActorsRec){
							var fut = that.system.spawnSorPeer(that.s,that.part,isolMatrix,that)
							that.onResolve(fut,function(ref){
								for(var i in that.myBorder){
									if(that.myBorder[i] != null){
										ref.addBorder(that.myBorder[i],i)
									}
								}
								ref.boot()
							})
						}
						else{
							setTimeout(function(){
								waitForBorder()
							},200)
						}
					}
					waitForBorder()

				},

				addBorder: function(border,pos){
					this.mBorder[pos] = border
				},

				borderMessage: function(){
					if(this.sorActorsSpawned == this.sorActorsRec){
						for(var i = 0;i < this.s;i++){
							this.sorActors[(i + 1) * (this.part + 1) - 1] = this.mBorder[i]
						}
						for(var i = 0;i < this.s;i++){
							for(var j = 0;j < this.part;j++){
								var pos = i * (this.part + 1) + j
								for(var z in this.sorActors){
									if(this.sorActors[z] != null){
										this.sorActors[pos].addMActor(this.sorActors[z],z)
									}
								}
								this.sorActors[pos].start(this.jacobi)
							}
						}
					}
					else{
						var that = this
						setTimeout(function(){
							that.borderMessage()
						},200)
					}
				},

				resultMessage: function(mx, my, mv, msgRcv){
					this.totalMsgRcv 	+= msgRcv
					this.returned 		+= 1
					this.gTotal 		+= mv
					if(this.returned == (this.s * this.part) + 1){
						this.system.actorExit()
					}
				}
			}

			var sorActorBehaviour = {
				pos: 				null,
				value: 				null,
				color: 				null,
				nx: 				null,
				ny: 				null,
				omega: 				null,
				sorSource: 			null,
				peer: 				null,
				//  
				x: 					null,
				y: 					null,
				omega_over_four:  	null,
				one_minus_omega: 	null,
				neighbors: 			[],
				iter: 				0,
				maxIter: 			0,
				msgRcv: 			0,
				sorActors: 			[],
				mActors: 			[],
				receivedVals: 		0,
				sum: 				0.0,
				expectingStart: 	true,
				pendingMessages: 	[],

			    calPos: function(x1,y1){
			    	return x1 * this.ny + y1
			    },

			    calcNeighbors: function(){
			    	var result = []
			    	if(this.x > 0 && this.x < this.nx - 1 && this.y > 0 && this.y < this.ny - 1){
			    		result[0] = this.calPos(this.x,this.y + 1)
			    		result[1] = this.calPos(this.x + 1,this.y)
			    		result[2] = this.calPos(this.x,this.y - 1)
			    		result[3] = this.calPos(this.x - 1,this.y)
			    	}
			    	else if((this.x == 0 || this.x == (this.nx - 1)) && (this.y == 0 || this.y == (this.ny - 1))){
			    		if(this.x == 0){
			    			result[0] = this.calPos(this.x + 1,this.y)
			    		}
			    		else{
			    			result[0] = this.calPos(this.x - 1,this.y)
			    		}
			    		if(this.y == 0){
			    			result[1] = this.calPos(this.x,this.y + 1)
			    		}
			    		else{
			    			result[1] = this.calPos(this.x,this.y - 1)
			    		}
			    	}
			    	else if((this.x == 0 || this.x == (this.nx - 1)) || (this.y == 0 || this.y == (this.ny - 1))){
			    		if(this.x == 0 || this.x == this.nx - 1){
			    			if(this.x == 0){
			    				result[0] = this.calPos(this.x + 1,this.y)
			    			}
			    			else{
			    				result[0] = this.calPos(this.x - 1,this.y)
			    			}
			    			result[1] = this.calPos(this.x,this.y + 1)
			    			result[2] = this.calPos(this.x,this.y - 1)
			    		}
			    		else{
			    			if(this.y == 0){
			    				result[0] = this.calPos(this.x,this.y + 1)
			    			}
			    			else{
			    				result[0] = this.calPos(this.x,this.y - 1)
			    			}
			    			result[1] = this.calPos(this.x + 1,this.y)
			    			result[2] = this.calPos(this.x - 1,this.y)
			    		}

			    	}
			    	return result
			    },

				config: function(pos,value,color,nx,ny,omega,sorSource,peer){
					this.pos 				= pos
					this.value 				= value
					this.color 				= color
					this.nx 				= nx
					this.ny 				= ny
					this.omega 				= omega
					this.sorSource			= sorSource
					this.peer 				= peer
					//
					this.x 					= Math.floor(pos / ny)
					this.y 					= pos % ny
					this.omega_over_four 	= 0.25 *  omega
					this.one_minus_omega 	= 1.0 - omega
					this.neighbors 			= this.calcNeighbors()
				},

				addMActor: function(mActor,pos){
					//console.log("added actor at position: " + pos)
					this.mActors[pos] = mActor
					//this.mActors.push(mActor)
				},

				start: function(mi){
					this.expectingStart = false
					this.sorActors 		= this.mActors
					this.maxIter 		= mi
					if(this.color == 1){
						for(var i in this.neighbors){
							this.sorActors[this.neighbors[i]].valueMessage(this.value)
						}
						this.iter   += 1
						this.msgRcv += 1
					}
					for(var i in this.pendingMessages){
						var lam = this.pendingMessages[i]
						lam()
					}
					this.pendingMessages = []
					this.mActors 		 = []
				},

				valueMessage: function(val){
					if(this.expectingStart){
						var that = this
						this.pendingMessages.push(function(){that.valueMessage(val)})
					}
					else{
						this.msgRcv += 1
						if(this.iter < this.maxIter){
							this.receivedVals += 1
							this.sum += val
							//console.log("Received vals: " + this.receivedVals + " length: " + this.neighbors.length)
							if(this.receivedVals == this.neighbors.length){
								this.value 			= (this.omega_over_four * this.sum ) + (this.one_minus_omega * this.value)
								this.sum 			= 0.0
								this.receivedVals 	= 0
								for(var i in this.neighbors){
									this.sorActors[this.neighbors[i]].valueMessage(this.value)
								}
								this.iter 			+= 1
							}
							if(this.iter == this.maxIter){
								this.sorSource.resultMessage(this.x,this.y,this.value,this.msgRcv)
								this.system.actorExit()
							}
						}
					}
				}
			}

			var sorPeerBehaviour = {
				omega: 				null,
				jacobi: 			null,
				s: 					null,
				partStart: 			null,
				matrixPart: 		null,
				border: 			null,
				sorSource: 			null, 
				gTotal: 			0.0,
				returned: 			0,
				totalMsgRcv: 		0,
				expectingBoot: 		true, 
				sorActors: 			[],
				sorActorsSpawned: 	0,
				sorActorsRec: 		0, 
				myBorder: 			null,

				config: function(omega,jacobi,s,partStart,matrix,sorSource){
					this.omega 		= omega
					this.jacobi 	= jacobi
					this.s 			= s
					this.partStart 	= partStart
					this.matrixPart = matrix
					this.border 	= []
					this.sorSource 	= sorSource
				},

				addBorder: function(borderElement,pos){
					this.border[pos]  = borderElement
				},

				boot: function(){
					this.expectingBoot 	= false
					this.myBorder 			= []
					for(var i = 0;i < this.s;i++){
						this.sorActors[i * (this.s - this.partStart + 1)] = this.border[i]
					}
					var that = this
					function outerLoop(i){
						if(i < that.s){
							var c = (i + that.partStart) % 2
							function innerLoop(j){
								if(j < (that.s - that.partStart + 1)){
									var pos = i * (that.s - that.partStart + 1) + j
									c = 1 - c
									var fut = that.system.spawnSorActor(pos,that.matrixPart[i][j-1],c,that.s,that.s - that.partStart + 1,that.omega,that,true)
									that.sorActorsSpawned += 1
									that.onResolve(fut,function(ref){
										//console.log("Added originally at position: " + pos)
										that.sorActors[pos] 	 = ref
										that.sorActorsRec 		+= 1
										if(j == 1){
											that.myBorder[i] = ref
										}
									})
									innerLoop(j + 1)
								}
							}
							innerLoop(1)
							outerLoop(i + 1)
						}
					}
					outerLoop(0)
					this.kickStart()
				},

				kickStart: function(){
					if(this.sorActorsSpawned == this.sorActorsRec){
						for(var i = 0;i < this.s;i++){
							for(var j = 1;j < (this.s - this.partStart + 1);j++){
								var pos = i * (this.s - this.partStart + 1) + j
								for(var z in this.sorActors){
									if(this.sorActors[z] != null){
										this.sorActors[pos].addMActor(this.sorActors[z],z)
									}
								}
								this.sorActors[pos].start(this.jacobi)
							}
						}
						for(var i in this.myBorder){
							if(this.myBorder[i] != null){
								this.sorSource.addBorder(this.myBorder[i],i)
							}
						}
						this.sorSource.borderMessage()
					}
					else{
						var that = this
						setTimeout(function(){
							that.kickStart()
						},200)
					}
				},

				resultMessage: function(mx, my, mv, msgRcv){
					this.totalMsgRcv 	+= msgRcv
					this.returned 		+= 1
					this.gTotal 		+= mv
					if(this.returned == this.s * (this.s - this.partStart)){
						this.sorSource.resultMessage(-1,-1,this.gTotal,this.totalMsgRcv)
						this.system.actorExit()
					}
				}
			}


			systemActor(sysBehaviour)
			var runnerRef = actor(sorRunnerBehaviour)
			runnerRef.config(N,dataSizes[N],omega,jacobi)
		},true)
	}

	return function(configs,startCB){
		var refVal		= configs[0]
		var dataSizes 	= configs[1]
		var jacobi 		= configs[2]
		var omega 		= configs[3]
		var N 			= configs[4]
		construct(refVal,dataSizes,jacobi,omega,N,startCB)
	}
})