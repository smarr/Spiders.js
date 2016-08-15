require(['./VAT'],function(VATModule){

/////////////////////
//Testing		   //
/////////////////////
console.log("Starting test")
var anX = 5
var producerBehaviour = {
	consumerRef: null,
	count: 0,
	test: {testVal: 666, testFunc: function(){console.log("Test function called ! ")}},

	init: function(){
		console.log("Producer initiated")
		/*var fut = this.system.getRef("consumer")
		this.onResolve(fut,function(ref){
			var fut2 = ref.consume(666)
			this.onResolve(fut2,function(val){
				console.log("Return of consume: " + val) 
			})
		})
		this.onRuin(fut,function(err){
			console.log("Getting actor failed with: " + err.message)
		})*/
	},

	goWrong: function(){
		console.log("Scope: " + anX)
	},

	registerConsumer: function(ref){
		console.log("Got ref ")
		this.consumerRef = ref
		this.startProducing()
	},

	startProducing: function(){
		this.count += 1
		console.log("Starting to produce")
		var consumeFut = this.consumerRef.consume(this.count)		 		
		var that = this
		return this.test
	}

}

var consumerBehaviour = {
	lastConsumed: null,

	init: function(){
		console.log("consumer initiated")
	},

	go: function(){
		var fut = this.system.getRef("producer")
		this.onResolve(fut,function(ref){
			var fut2 = ref.registerConsumer(this.selfRef)
			this.onRuin(fut2,function(err){
				console.log("Passing failed with: " + err.message)
			})
		})
	},

	consume: function(val){
		console.log("Consumer consumed:  " + val)
		this.lastConsumed = val
		this.system.perform(5,5)
		return " how does this work ? "
	}
}

var sysBehaviour = {

	printOnSystem: function(message){
		console.log("System just received : " + message )
	},

	perform: function(x,y){
		console.log("Result of perform: " + (x +  y))
	}
}

VATModule(function(actor,systemActor,onResolve,onRuin){
	systemActor(sysBehaviour)
	var consumerRef = actor(consumerBehaviour,"consumer")
	var producerRef = actor(producerBehaviour,"producer")
	consumerRef.go()
})


/*var registerFut = producerRef.registerConsumer(consumerRef)
VATModule.onResolve(registerFut,function(dontcare){
	var produceFut = producerRef.startProducing()
	VATModule.onResolve(produceFut,function(testProxy){
		var proxyValFut = testProxy.testVal
		VATModule.onResolve(proxyValFut,function(value){
			console.log("Test value from proxy = " + value)
		})
		testProxy.testFunc()
	})
	VATModule.onRuin(produceFut,function(err){
		console.log("Produce failed with: " + err.message)
	})
})*/



})