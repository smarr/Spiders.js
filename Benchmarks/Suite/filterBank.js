define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfColumns,amountOfSimulations,amountOfChannels,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsExited: 		0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == 6 + amountOfChannels + amountOfChannels * 6){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								producerRef.nextMessage()
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

			var producerBehaviour = {
				sourceRef: 			null,
				totalSimulations: 	null,
				messagesSent: 		0,

				config: function(totalSimulations,sourceRef){
					this.totalSimulations 	= totalSimulations
					this.sourceRef 			= sourceRef
					this.system.actorInit()
				},

				nextMessage: function(){
					if(this.messagesSent == this.totalSimulations){
						this.sourceRef.exit()
					}
					else{
						this.sourceRef.boot()
						this.messagesSent += 1
					}
				}
			}

			var sourceBehaviour = {
				producerRef: 	null,
				branchesRef: 	null,
				maxValue: 		1000,
				current: 		0,

				config: function(producerRef,branchesRef){
					this.producerRef = producerRef
					this.branchesRef = branchesRef
					this.system.actorInit()
				},

				boot: function(){
					this.branchesRef.valueMessage(this.current)
					this.current = (this.current + 1) % this.maxValue
					this.producerRef.nextMessage()
				},

				exit: function(){
					this.branchesRef.exit()
				}
			}

			var sinkBehaviour = {
				count: 0,

				init: function(){
					this.system.actorInit()
				},

				valueMessage: function(val){
					this.count += 1
				}
			}

			var branchBehaviour = {
				banks: 			[],
				integrateRef: 	null,

				config: function(integrateRef){
					this.integrateRef = integrateRef
				},

				newBank: function(bankRef){
					this.banks.push(bankRef)
				},

				configDone: function(){
					this.system.actorInit()
				},

				valueMessage: function(val){
					for(var i in this.banks){
						this.banks[i].valueMessage(val)
					}
				},

				exit: function(){
					for(var i in this.banks){
						this.banks[i].exit()
					}
				}
			}

			var bankBehaviour = {
				id: 			null,
				totalColumns: 	null,
				integrateRef: 	null,
				firstRef: 		null,

				config: function(id,totalColumns,integrateRef,firstRef){
					this.id 			= id
					this.totalColumns 	= totalColumns
					this.integrateRef 	= integrateRef
					this.firstRef 		= firstRef
					this.system.actorInit()
				},

				valueMessage: function(val){
					this.firstRef.valueMessage(val)
				},

				exit: function(){
					this.firstRef.exit()
				}
			}

			var delayBehaviour = {
				sourceId: 		null,
				delayLength: 	null,
				nextRef: 		null,
				state: 			[],
				placeHolder: 	0,

				config: function(sourceId,delayLength,nextRef){
					this.sourceId 		= sourceId
					this.delayLength 	= delayLength
					this.nextRef 		= nextRef
					for(var i = 0;i < delayLength;i++){
						this.state[i] = 0
					}
					this.system.actorInit()
				},

				valueMessage: function(val){
					this.nextRef.valueMessage(this.state[this.placeHolder])
					this.state[this.placeHolder] = val
					this.placeHolder = (this.placeHolder + 1) %  this.delayLength
				},

				exit: function(){
					this.nextRef.exit()
				}
			}

			var firFilterBehaviour = {
				sourceId: 	null,
				peekLength: null,
				coef: 		[],
				nextRef: 	null,
				data: 		[],
				dataIndex: 	0,
				dataFull: 	false,

				config: function(sourceId,peekLength,nextRef){
					this.sourceId 	= sourceId
					this.peekLength = peekLength
					this.nextRef 	= nextRef
					for(var i = 0;i < peekLength;i++){
						this.data[i] = 0
					}
				},

				newCoef: function(c){
					this.coef.push(c)
				},

				configDone: function(){
					this.system.actorInit()
				},

				valueMessage: function(val){
					this.data[this.dataIndex] = val
					this.dataIndex += 1
					if(this.dataIndex == this.peekLength){
						this.dataFull = true
						this.dataIndex = 0
					}
					if(this.dataFull){
						var sum = 0.0
						var i 	= 0
						while(i < this.peekLength){
							sum += this.data[i] * this.coef[this.peekLength - i - 1]
							i   += 1
						}
						this.nextRef.valueMessage(sum)
					}
				},

				exit: function(){
					this.nextRef.exit()
				}
			}

			var sampleFilterBehaviour = {
				sampleRate: 		null,
				nextRef: 			null,
				samplesReceived: 	0,

				config: function(sampleRate,nextRef){
					this.sampleRate = sampleRate
					this.nextRef 	= nextRef
					this.system.actorInit()
				},

				valueMessage: function(val){
					if(this.samplesReceived == 0){
						this.nextRef.valueMessage(val)
					}
					else{
						this.nextRef.valueMessage(0)
					}
					this.samplesReceived =  (this.samplesReceived + 1) % this.sampleRate
				},

				exit: function(){
					this.nextRef.exit()
				}
			}

			var taggedForwardBehaviour = {
				sourceId: 	null,
				nextRef: 	null,

				config: function(sourceId,nextRef){
					this.sourceId 	= sourceId
					this.nextRef 	= nextRef
					this.system.actorInit()
				},

				valueMessage: function(val){
					this.nextRef.sourceValueMessage(this.sourceId,val)
				},

				exit: function(){
					this.nextRef.exit()
				}
			}

			var integratorBehaviour = {
				totalChannels: 	null,
				combineRef: 	null,
				data: 			{},
				dataIndex: 		0,
				exitsReceived: 	0,

				config: function(totalChannels,combineRef){
					this.totalChannels 	= totalChannels
					this.combineRef 	= combineRef
					this.system.actorInit()
				},

				removeEntry: function(key){
					var copy = {}
					for(var i in this.data){
						if(!(i == key)){
							copy[key] = this.data[key]
						}
					}
					this.data = copy
				},

				sourceValueMessage: function(sourceId,val){
					var dataSize = 0
					for(var i in this.data){
						dataSize += 1
					}
					var processed = false
					var i = 0
					while(i < dataSize){
						var loopMap = this.data[i]
						if(!(sourceId in loopMap)){
							loopMap[sourceId] = val
							processed = true
							i = dataSize
						}
						i += 1
					}
					if(!processed){
						var newMap = {}
						newMap[sourceId] = val
						this.data[this.dataIndex] = newMap
						this.dataIndex += 1
					}
					var firstMap = this.data[0]
					var firstMapSize = 0
					for(var i in firstMapSize){
						firstMapSize += 1
					}
					if(firstMapSize == this.totalChannels){
						for(var i in firstMap){
							this.combineRef.newVal(firstMap[i])
						}
						this.combineRef.valEnd()
						this.removeEntry(0)
					}
				},

				exit: function(){
					this.exitsReceived += 1
					if(this.exitsReceived == this.totalChannels){
						this.system.end()
					}
				}
			}

			var combineBehaviour = {
				sinkRef: null,
				sum: 	 0,

				config: function(sinkRef){
					this.sinkRef = sinkRef
					this.system.actorInit()
				},

				newVal: function(val){
					this.sum += val
				},

				valEnd: function(){
					this.sinkRef.valueMessage(this.sum)
					this.sum = 0
				}

			}


			systemActor(sysBehaviour)
			var producerRef 	= actor(producerBehaviour)
			var sinkRef 		= actor(sinkBehaviour)
			var combineRef 		= actor(combineBehaviour)
			combineRef.config(sinkRef)
			var integrateRef 	= actor(integratorBehaviour)
			integrateRef.config(amountOfChannels,combineRef)
			var branchesRef 	= actor(branchBehaviour)
			branchesRef.config(integrateRef)
	        var H = {}
	        var F = {}
	        for(var j = 0; j < amountOfChannels;j++){
	        	H[j] = {}
	        	F[j] = {}
	        	for(var i = 0; i < amountOfColumns;i++){
	        		H[j][i] = (1.0 * i * amountOfColumns) + (1.0 * j * amountOfChannels) + j + i + j + 1;
	        		F[j][i] = (1.0 * i * j) + (1.0 * j * j) + j + i
	        	}
	        }
			for(var i = 0;i < amountOfChannels ; i++){
				var taggedRef 		= actor(taggedForwardBehaviour)
				taggedRef.config(i,integrateRef)
				var firFilt2Ref 	= actor(firFilterBehaviour)
				firFilt2Ref.config(i + ".2",amountOfColumns,taggedRef)
				for(var c in F[i]){
					firFilt2Ref.newCoef(F[i][c])
				}
				firFilt2Ref.configDone()
				var delayRef 		= actor(delayBehaviour)
				delayRef.config(i + ".2",amountOfColumns - 1,firFilt2Ref)
				var sampleFiltRef	= actor(sampleFilterBehaviour)
				sampleFiltRef.config(amountOfColumns,delayRef)
				var firFiltRef 		= actor(firFilterBehaviour)
				firFiltRef.config(i + ".1",amountOfColumns,sampleFiltRef)
				for(var c in H[i]){
					firFiltRef.newCoef(H[i][c])
				}
				firFiltRef.configDone()
				var firstRef		= actor(delayBehaviour)
				firstRef.config(i + ".1",amountOfColumns - 1,firFiltRef)
				var bankRef 		= actor(bankBehaviour)
				bankRef.config(i,amountOfColumns,integrateRef,firstRef)
				branchesRef.newBank(bankRef)
			}
			branchesRef.configDone()
			var sourceRef = actor(sourceBehaviour)
			sourceRef.config(producerRef,branchesRef)
			producerRef.config(amountOfSimulations,sourceRef)
		},true)
	}

	return function(configs,startCB){
		var amColumns 		= configs[0]
		var amSimulations 	= configs[1]
		var amChannels 		= configs[2]
		construct(amColumns,amSimulations,amChannels,startCB)
	}
})