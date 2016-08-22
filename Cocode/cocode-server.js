var vatModule = require('./Server/VAT')

var server = {
	clients: {},

	init: function(){
		console.log("Server initialised")
	},

	register: function(name,ref){
		console.log("New client registered: " + name)
		for(var i in this.clients){
			this.clients[i].newCoder(name)
			ref.newCoder(i)
		}

		this.clients[name] = ref
	},

	newCode: function(coderName,code){
		for(var i in this.clients){
			console.log("Coder: " + coderName + " current: " + i)
			if(i != coderName){
				console.log("Sending new code to: " + coderName + " => " + code)
				this.clients[i].newCode(code)
			}
		}
	},

	publicMessage: function(message){
		for(var i in this.clients){
			this.clients[i].newPublicMessage(message)
		}
	}

}

vatModule(function(actor,systemActor,onResolve,onRuin){
	systemActor(server,8080)
})