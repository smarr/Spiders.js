require(['./VAT'],function(VATModule){

VATModule(function(actor,systemActor,onResolve,onRuin){
	console.log("Starting remote test")

	var systemBehaviour = {
		init: function(){
			console.log("System initiated")
			var fut = this.getRemoteRef('localhost',8080)
			this.onResolve(fut,function(ref){
				ref.getSysBRef(this)
			})
		},

		acknowledge: function(remoteBRef){
			var fut = remoteBRef.printThroughRoute("P2P routing works !!! ")
			this.onResolve(fut,function(val){
				console.log("Return value for p2p routing: " + val)
			})
		},

		getIsol: function(isol){
			console.log("Got isolate through routing with value: " + isol.val)
		}

	}

	var actorBehaviour = {

		init: function(){
			console.log("Actor initiated")
			var fut = this.getRemoteRef('localhost',8081)
			this.onResolve(fut,function(ref){
				var f = ref.getRef(this)
				this.onResolve(f,function(v){
					var iso = this.isolate({
						val: 666
					})
					ref.forward(iso)
				})
				/*ref.print("hello from browser")
				var obFut = ref.object
				this.onResolve(obFut,function(object){
					var valFut = object.val
					this.onResolve(valFut,function(v){
						console.log("Remote value : " + v)
					})
					var funcFut = object.compute(10)
					this.onResolve(funcFut,function(v){
						console.log("Compute returned: " + v)
					})
				})
				ref.twoWay(this.selfRef)*/
			})
			this.onRuin(fut,function(err){
				console.log("Request for remote far reference was ruined with: " + err.message)
			})
		},

		printFromServer: function(message){
			console.log("Received from server: " + message)
			return 51
		},

		printThroughRoute: function(message){
			console.log("Received through p2p routing: " + message)
			return 15
		},

		getSystem : function(){
			var fut = this.getRemoteRef("localhost:3000/","system")
			this.onResolve(fut,function(ref){
				console.log("Got remote system ref")
			})
			this.onRuin(fut,function(err){
				console.log(err.message)
			})
		}
	}


	systemActor(systemBehaviour)
	actor(actorBehaviour,"a1")
})
})