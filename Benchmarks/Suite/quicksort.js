define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(dataSize,maxVal,threshold,configCallback){
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
								quickRef.sort()
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

				spawnNew: function(parentRef,position){
					var qRef = actor(quickBehaviour)
					qRef.config(true,dataSize,maxVal,threshold,parentRef,position)
					this.totalSpawned += 1
					return qRef
				}

			}

			var quickBehaviour = {
				dataSize: 		null,
				maxVal: 		null,
				threshold: 		null,
				parentRef: 		null,
				position: 		null,
				data: 			[],
				result: 		[],
				numFragments: 	0,
				exited: 		false,

				config: function(hasParent,dataSize,maxVal,threshold,parentRef,position){
					if(hasParent){
						this.parentRef 	= parentRef
					}
					this.dataSize 		= dataSize
					this.maxVal 		= maxVal
					this.threshold 		= threshold
					this.position 		= position
				},

				newData: function(dataPoint){
					this.data.push(dataPoint)
				},

				configDone: function(){
					this.system.actorInit()
				},

				sequentialSort: function(dataCopy){
					var dataLength 		= dataCopy.length
					if(dataLength < 2){
						return dataCopy
					}
					else{
						var pivot 			= dataCopy[Math.floor(dataLength / 2)]
						var leftUnsorted 	= this.filterLessThan(dataCopy,pivot)
						var leftSorted 		= this.sequentialSort(leftUnsorted)
						var equalElements 	= this.filterEqualsTo(dataCopy,pivot)
						var rightUnsorted 	= this.filterGreaterThan(dataCopy,pivot)
						var rightSorted 	= this.sequentialSort(rightUnsorted)
						var sorted 			= []
						for(var i in rightUnsorted){
							sorted.push(rightUnsorted[i])
						}
						for(var i in equalElements){
							sorted.push(equalElements[i])
						}
						for(var i in leftUnsorted){
							sorted.push(leftUnsorted[i])
						}
						return sorted
					}
				},

				notifyParentAndTerminate: function(){
					if(this.parentRef != null){
						this.parentRef.gotResult(this.result,this.position)
					}
					else{
						this.system.end()
					}
					this.exited = true
				},

				filterLessThan: function(dataCopy,pivot){
					var dataLength 	= dataCopy.length
					var result 		= []
					for(var i in dataCopy){
						if(dataCopy[i] < pivot){
							result.push(dataCopy[i])
						}
					}
					return result
				},

				filterGreaterThan: function(dataCopy,pivot){
					var dataLength 	= dataCopy.length
					var result 		= []
					for(var i in dataCopy){
						if(dataCopy[i] > pivot){
							result.push(dataCopy[i])
						}
					}
					return result
				},

				filterEqualsTo: function(dataCopy,pivot){
					var dataLength 	= dataCopy.length
					var result 		= []
					for(var i in dataCopy){
						if(dataCopy[i] == pivot){
							result.push(dataCopy[i])
						}
					}
					return result
				},

				sort: function(){
					if(!this.exited){
						var dataLength = this.data.length
						if(dataLength < this.threshold){
							this.sequentialSort(this.data)
							this.notifyParentAndTerminate()
						}
						else{
							var dataLengthHalf 	= dataLength / 2
							var pivot 			= this.data[dataLengthHalf]
							var leftUnsorted 	= this.filterLessThan(this.data,pivot)
							var fut 			= this.system.spawnNew(this,"LEFT")
							this.onResolve(fut,function(ref){
								for(var i in leftUnsorted){
									ref.newData(leftUnsorted[i])
								}
								ref.configDone()
								ref.sort()
							})
							var rightUnsorted 	= this.filterGreaterThan(this.data,pivot)
							var fut2 			= this.system.spawnNew(this,"RIGHT")
							this.onResolve(fut2,function(ref){
								for(var i in rightUnsorted){
									ref.newData(rightUnsorted[i])
								}
								ref.configDone()
								ref.sort()
							})
							this.result = this.filterEqualsTo(this.data,pivot)
							this.numFragments += 1
						}
					}
				},

				gotResult: function(result,fromPosition){
					if(!(this.data.length == 0)){
						if(fromPosition == "LEFT"){
							var temp = []
							for(var i in this.result){
								temp.push(this.result[i])
							}
							for(var i in result){
								temp.push(result[i])
							}
							this.result = temp
						}
						else if(fromPosition == "RIGHT"){
							var temp = []
							for(var i in result){
								temp.push(result[i])
							}
							for(var i in this.result){
								temp.push(this.result[i])
							}
							this.result = temp
						}
					}
					this.numFragments += 1
					if(this.numFragments == 3){
						this.notifyParentAndTerminate()
					}
				}

			}	

			

			systemActor(sysBehaviour)
			var quickRef = actor(quickBehaviour)
			quickRef.config(false,dataSize,maxVal,threshold,0,"INITIAL")
			for(var i = 0;i < dataSize;i++){
				var data = Math.floor(Math.random() * (maxVal - 0) + 0) % maxVal
				quickRef.newData(data)
			}
			quickRef.configDone()
		},true)
	}

	return function(configs,startCB){
		var dataSize 	= configs[0]
		var maxVal 		= configs[1]
		var threshold 	= configs[2]
		construct(dataSize,maxVal,threshold,startCB)
	}
})