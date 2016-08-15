define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(pieces,workers,left,right,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				actorsExited: 		0,
				benchEnd: 			null,
				totalSpawned: 		2,
				totalEnded: 		0,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == workers + 1){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								masterRef.work()
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
					if(this.actorsExited == (workers + 1)){
						this.benchEnd()
					}
				},

				end: function(){
					this.benchEnd()
				},

			}

			var masterBehaviour = {
				left: 			null,
				right: 			null,
				precision: 		null,
				workers: 		[],
				termsReceived: 	0,
				resultArea: 	0.0,

				config: function(left,right,precision){
					this.left 		= left
					this.right 		= right
					this.precision 	= precision
				},

				newWorker: function(ref){
					this.workers.push(ref)
				},

				configDone: function(){
					this.system.actorInit()
				},

				work: function(){
					var workerRange = (this.right - this.left) / this.workers.length
					var index = 0
					for(var i in this.workers){
						var wl = (workerRange * index) + this.left
						var wr = wl + workerRange
						this.workers[i].work(wl,wr,this.precision)
						index += 1
					}
				},

				result: function(area,id){
					this.termsReceived += 1
					this.resultArea += area
					if(this.termsReceived == this.workers.length){
						this.system.actorExit()
					}
				}
			}

			var workerBehaviour = {
				masterRef: 	null,
				id: 		null,

				config: function(masterRef,id){
					this.masterRef 	= masterRef
					this.id 		= id
					this.system.actorInit()
				},

				fx: function(x){
					var a = Math.sin(Math.pow(x,3) - 1)
					var b = x + 1
					var c = a / b
					var d = Math.sqrt(1 + Math.exp(Math.sqrt(2 * x)))
					var r = c * d 
					return r 
				},

				work: function(wl,wr,precision){
					var n 			= ((wr - wl) / precision)
					var accumArea 	= 0.0
					var i  			= 0
					while(i < n){
						var lx 		= (i * precision) + wl
						var rx 		= lx + precision
						var ly 		= this.fx(lx)
						var ry 		= this.fx(rx)
						var area 	= 0.5 * (ly + ry) * precision
						accumArea  += area
						i 		   += 1 
					} 
					this.masterRef.result(accumArea,this.id)
					this.system.actorExit()
				}
			}

			systemActor(sysBehaviour)
			var masterRef = actor(masterBehaviour)
			var precision = (right - left) / pieces
			masterRef.config(left,right,precision)
			var id = 0
			for(var i = 0;i < workers;i++){
				var workerRef = actor(workerBehaviour)
				masterRef.newWorker(workerRef)
				workerRef.config(masterRef,id)
				id += 1
			}
			masterRef.configDone()
		},true)
	}

	return function(configs,startCB){
		var pieces 		= configs[0]
		var workers 	= configs[1]
		var left 		= configs[2]
		var right 		= configs[3]
		construct(pieces,workers,left,right,startCB)
	}
})