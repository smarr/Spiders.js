var vatModule = require('./VAT')

var anX = 5
var beh1 = {
	imports:['./actorImportTest'],

	init: function(){
		console.log("Actor one initiated")
		console.log("Test import: " + this.value)
	},

	log: function(message){
		console.log("!!!Actor 1 received: " + message)
	},

	logWrong: function(){
		console.log("!!!Actor 1 scope: " + anX)
	}
}

var beh2 = {

	init: function(){
		console.log("Actor two initiated")
	},

	log: function(message){
		console.log("!!!Actor 2 received: " + message)
	},

	check: function(){
		var refFut = this.system.getRef("Actor 1")
		this.onResolve(refFut,function(ref){
			console.log("Get ref to Actor 1")
			ref.log("!!!Hello from 2")
			var fut = ref.logWrong()
			this.onRuin(fut,function(err){
				console.log("Error caught in actor:" + err.message)
			})
			this.onResolve(fut,function(val){
				console.log("Error should have been caught in actor ! ")
			})		
		})
		this.onRuin(refFut,function(err){
			console.log("Getting ref to actor 1 failed with: " + err.message)
		})
	}
}

var publicActor = {

	init: function(){
		console.log("Public actor initated")
		//this.system.printInternal("Hello")
	},

	getRef: function(browserRef){
		console.log("Got browser ref")
		this.system.getBRef(browserRef)
	},

	forward: function(isol){
		this.system.forward(isol)
	}

}

var sysBeh = {

	sysBRef: null,

	init: function(){
		console.log("System started ")
	},

	printInternal: function(message){
		console.log("System: " + message)
	},

	getSysBRef: function(sysRef){
		this.sysBRef = sysRef
	},

	getBRef: function(browserRef){
		this.sysBRef.acknowledge(browserRef) //uncomment for peer to peer check
		/*var fut = browserRef.printFromServer("Hello from server")
		this.onResolve(fut,function(val){
			console.log("call to browser resolved to: " + val)
		})*/
	},

	forward: function(isol){
		console.log("Forwarding isolate with value: " + isol.val)
		this.sysBRef.getIsol(isol)
	}

}

vatModule(function(actor,systemActor,onResolve,onRuin){
	systemActor(sysBeh,8080)
	actor(publicActor,"Public",8081,function(ref){

	})
})
/*vatModule(function(actor,systemActor,actors,isolate,onResolve,onRuin){
	systemActor(sysBeh,8080)
	actor(beh1,"Actor 1",8081,function(ref1){
		ref1.log("System actor")
		actor(beh2,"Actor 2",8082,function(ref2){
			ref2.log("System actor")
			ref2.check()
			var f = ref1.logWrong()
			onRuin(f,function(err){
				console.log("System actor caught: " + err.message)
			})
		})
	})
})*/

