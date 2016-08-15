define(function(){
	var construct 	 = function(amountOfHaircuts,roomSize,prodRate,hairRate,configCallback){
		var actorsInitialised = 	0
		var benchEnd =		null
		function sysHandle(event){
			function checkConfig(){
				if(actorsInitialised == amountOfHaircuts +  3){
					configCallback(
						function(be){
							benchEnd 		= be
							customerFactoryRef.postMessage(["start"])
						},
						function(){
							waitingRoomRef.terminate()
							customerFactoryRef.terminate()
							barberRef.terminate()
							for(var i in customers){
								customers[i].terminate()
							}
						}
					)
				}
			}

			function actorInit(){
				actorsInitialised += 1
				checkConfig()
			}

			function end(){
				benchEnd()
			}

			switch(event.data[0]){
				case "actorInit":
					actorInit()
					break;
				case "end":
					end()
					break;
				default :
					console.log("Unknown message: " + event.data[0])
			}
		}

		var barberRef = new Worker('./natBarberBarber.js')
		barberRef.onmessage = sysHandle
		barberRef.postMessage(["config",hairRate])
		var waitingRoomRef = new Worker('./natBarberWaitingRoom.js')
		waitingRoomRef.onmessage = sysHandle
		var barChan = new MessageChannel()
		waitingRoomRef.postMessage(["config",roomSize],[barChan.port1])
		barberRef.postMessage(["linkRoom"],[barChan.port2])
		var customerFactoryRef = new Worker('./natBarberCustomerFactory.js')
		customerFactoryRef.onmessage = sysHandle
		var custChan = new MessageChannel()
		waitingRoomRef.postMessage(["link"],[custChan.port1])
		customerFactoryRef.postMessage(["config",amountOfHaircuts,prodRate],[custChan.port2])
		var customers 				= []
		var custCount 			= amountOfHaircuts - 1
		while(custCount >= 0){
			var newCust = new Worker('./natBarberCustomer.js')
			newCust.onmessage = sysHandle
			var custoChan = new MessageChannel()
			newCust.postMessage(["config"],[custoChan.port2])
			customerFactoryRef.postMessage(["newCustomer"],[custoChan.port1])
			customers.push(newCust)
			custCount -= 1
		}
	}

	return function(configs,startCB){
		var amHaircuts 	= configs[0]
		var roomSize 	= configs[1]
		var prodRate 	= configs[2]
		var hairRate 	= configs[3]
		construct(amHaircuts,roomSize,prodRate,hairRate,startCB)
	}
})