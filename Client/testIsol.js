require(['./VAT'],function(VATModule){

	var sysBehaviour = {
		init: function(){
			console.log("System initialised")
		}
	}

	var a1 = {
		init: function(){
			console.log("Actor 1 initialised")
			var f = this.system.getRef("Actor 2")
			this.onResolve(f,function(ref){
				var isol = this.isolate({
					x: 1200
				})
				ref.getIsol({x: 1200})
			})
		}
	}

	var a2 = {
		init: function(){
			console.log("Actor 2 initialised")
		},

		getIsol: function(isol){
			//console.log("Value of isol: " + isol.x)
			var f = isol.x
			this.onResolve(f,function(val){
				console.log("Value of remote: " + val)
			})
		}
	}



	VATModule(function(actor,systemActor,onResolve,onRuin){
		systemActor(sysBehaviour)
		var consumerRef = actor(a1,"Actor 1")
		var producerRef = actor(a2,"Actor 2")
	})




})