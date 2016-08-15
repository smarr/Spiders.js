define(function(){
	var construct 	 = function(refVal,dataSizes,jacobi,omega,N,configCallback){
		var actorsInitialised = 	0
		var actorsExited = 		0
		var benchEnd = 			null
		var totalEnded = 		0
		var totalSpawned = 		1
		var allSpawned = []

		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == 1){
					configCallback(
						function(be){
							benchEnd 		= be
							runnerRef.postMessage(["boot"])
						},
						function(){
							runnerRef.terminate()
							for(var i in allSpawned){
								allSpawned[i].terminate()
							}
						}
					)
				}
			}

			function actorInit(){
				actorsInitialised += 1
				checkConfig()
			}

			function actorExit(){
				actorsExited += 1
				if(actorsExited == totalSpawned){
					benchEnd()
				}
			}

			function end(){
				benchEnd()
			}

			function spawnSorActor(pos,value,color,nx,ny,omega,sorSource,peer,index,indexJ){
				var actRef = new Worker('./natSorActor.js')
				var chan = new MessageChannel()
				sorSource.postMessage(["sorActorSpawned",pos,index,indexJ],[chan.port2])
				actRef.onmessage = sysHandle
				allSpawned.push(actRef)
				actRef.postMessage(["config",pos,value,color,nx,ny,omega,peer],[chan.port1])
				this.totalSpawned += 1
			}

			function spawnSorPeer(s,partStart,matrix,sorSource){
				var peerRef = new Worker('./natSorPeer.js')
				var chan = new MessageChannel()
				sorSource.postMessage(["sorPeerSpawned"],[chan.port2])
				peerRef.onmessage = sysHandle
				allSpawned.push(peerRef)
				peerRef.postMessage(["config",omega,jacobi,s,partStart,matrix],[chan.port1])
				this.totalSpawned += 1
			}

			switch(event.data[0]){
				case "actorInit":
					actorInit()
					break;
				case "actorExit":
					actorExit()
					break;
				case "end":
					end()
					break;
				case "spawnSorActor":
					spawnSorActor(event.data[1],event.data[2],event.data[3],event.data[4],event.data[5],event.data[6],event.ports[0],event.data[7],event.data[8],event.data[9])
					break;
				case "spawnSorPeer":
					spawnSorPeer(event.data[1],event.data[2],event.data[3],event.ports[0])
					break;
				default :
					console.log("Unknown message (System): " + event.data[0])
			}
		}

		var runnerRef = new Worker('./natSorRunner.js')
		runnerRef.onmessage = sysHandle
		runnerRef.postMessage(["config",N,dataSizes[N],omega,jacobi])
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