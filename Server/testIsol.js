var vatModule = require('./VAT')

var sys = {
	init: function(){
		console.log("System initialised")
	}
}

var a1 = {
	init: function(){
		console.log("Actor 1 initialised")
		var fut = this.getRemoteRef("localhost",8082)
		this.onResolve(fut,function(ref){
			/*var ob = this.isolate({
				x: 1200,
			})*/
			var ob = this.isolate([1,2,3,4])
			ref.getIsol(ob)
		})
	}
}
//TODO FIX METHODS
var a2 = {
	init: function(){
		console.log("Actor 2 initialised")
	},

	getIsol: function(isol){
		//console.log("Value for x: " + isol.x)
		console.log("Isolate: " + isol)
	}
}

vatModule(function(actor,systemActor,actors,isolate,onResolve,onRuin){
	systemActor(sys,8080)
	actors([a1,a2],["Actor 1","Actor 2"],[8081,8082],function(r1,r2){

	})
})