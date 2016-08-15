var vatModule = require('./VAT')

var b1 = {
	init: function(){
		console.log("Actor initialised")
	},

	print: function(message){
		console.log(message)
	}

}

var b2 = {
	init: function(){
		console.log("Actor initialised")
		var f = this.getRemoteRef("localhost","8081")
		this.onResolve(f,function(ref){
			console.log("Got remote ref")
			ref.print("Hello from actor 2")
		})
	}
}

var s = {
	init: function(){
		console.log("System initialised")
	}


}

vatModule(function(actor,systemActor,actors,isolate,onResolve,onRuin){
	systemActor(s,8080)
	actors([b1,b2],["Actor 1","Actor 2"],[8081,8082],function(ref1,ref2){
		console.log("Got refs: " + ref1 + "," + ref2)
		ref1.print("Multi actors work")
	})
})