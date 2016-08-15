define(['../Client/VAT'],function(vatModule){
	var construct 	 = function(amountOfHaircuts,roomSize,prodRate,hairRate,configCallback){
		vatModule(function(actor,systemActor,onResolve,onRuin,killAll){

			var sysBehaviour = {
				actorsInitialised: 	0,
				benchEnd: 			null,

				checkConfig: 		function(){
					var that = this
					if(this.actorsInitialised == amountOfHaircuts +  3){
						configCallback(
							function(benchEnd){
								that.benchEnd 		= benchEnd
								customerFactoryRef.start()
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

			var waitingRoomBehaviour = {
				capacity: 		0,
				waiting: 		[],
				barberRef: 		null,
				barberSleep: 	true,

				config: function(capacity){
					this.capacity = capacity
					var fut = this.system.getRef("barber")
					this.onResolve(fut,function(barberRef){
						this.barberRef = barberRef
						this.system.actorInit()
					})
				},

				customerEnter: function(customerRef){
					if(this.waiting.length == this.capacity){
						customerRef.roomFull()
					}
					else{
						this.waiting.push(customerRef)
						if(this.barberSleep){
							this.barberSleep = false
							this.nextCustomer()
						}
					}
				},

				nextCustomer: function(){
					if(this.waiting.length > 0){
						var customer = this.waiting.pop()
						this.barberRef.newCustomer(customer,this)
					}
					else{
						this.barberSleep = true
					}
				}

			}

			var barberBehaviour = {
				haircutRate: null,

				config: function(haircutRate){
					this.haircutRate = haircutRate
					this.system.actorInit()
				},

				busyWait: function(limit){
					for(var i = 0;i < limit;i++){
						Math.floor(Math.random() * (limit - 0 + 1)) + 0;
					}
				},

				newCustomer: function(customer,room){
					this.busyWait(this.haircutRate)
					customer.done()
					room.nextCustomer()
				}

			}

			var customerFactoryBehaviour = {
				totalHaircuts: 		0,
				productionRate: 	0,
				currentHaircuts: 	0,
				roomRef: 			null,
				customers: 			[],

				config: function(totalHaircuts,productionRate){
					this.totalHaircuts 	= totalHaircuts
					this.productionRate = productionRate
					var fut = this.system.getRef("waitingRoom")
					this.onResolve(fut,function(roomRef){
						this.roomRef = roomRef
					})
				},

				newCustomer: function(customerRef){
					this.customers.push(customerRef)
					if(this.customers.length == this.totalHaircuts){
						this.system.actorInit()
					}
				},

				busyWait: function(limit){
					for(var i = 0;i < limit;i++){
						Math.floor(Math.random() * (limit - 0 + 1)) + 0;
					}
				},

				start: function(){
					for(var i in this.customers){
						this.roomRef.customerEnter(this.customers[i])
						this.busyWait(this.productionRate)
					}
				},

				returned: function(customer){
					this.roomRef.customerEnter(customer)
				},

				done: function(){
					this.currentHaircuts += 1
					if(this.currentHaircuts == this.totalHaircuts){
						this.system.end()
					}
				}

			}

			var customerBehaviour = {
				factoryRef: null,

				init: function(){
					var fut = this.system.getRef("customerFactory")
					this.onResolve(fut,function(factoryRef){
						this.factoryRef = factoryRef
						this.system.actorInit()
					})
				},

				roomFull: function(){
					this.factoryRef.returned(this)
				},

				done: function(){
					this.factoryRef.done()
				}

			}


			systemActor(sysBehaviour)
			var barberRef 			= actor(barberBehaviour,"barber")
			barberRef.config(hairRate)
			var customerFactoryRef 	= actor(customerFactoryBehaviour,"customerFactory")
			customerFactoryRef.config(amountOfHaircuts,prodRate)
			var waitingRoomRef 		= actor(waitingRoomBehaviour,"waitingRoom")
			waitingRoomRef.config(roomSize)
			customers 				= []
			var custCount 			= amountOfHaircuts - 1
			while(custCount >= 0){
				var newCust = actor(customerBehaviour)
				customerFactoryRef.newCustomer(newCust)
				customers.push(newCust)
				custCount -= 1
			}
		},true)
	}

	return function(configs,startCB){
		var amHaircuts 	= configs[0]
		var roomSize 	= configs[1]
		var prodRate 	= configs[2]
		var hairRate 	= configs[3]
		construct(amHaircuts,roomSize,prodRate,hairRate,startCB)
	}
})