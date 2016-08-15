define(['./messages'],function(msgModule){

	var makeSocketManager = function(){
		return {
			systemIp: 			null,

			messageHandler: 	null,

			connections: 		{},

			openConnection : 	function(address,port,connectedCallback){
				var socket
				if(address == this.systemIp){
					socket = io('http://localhost:'+port)
				}
				else{
					socket = io('http://'+address+':'+port)
				}
				socket.on('connect',function(){
					this.connections[address+port] = socket
					//console.log("Connected to " + 'http://' + address + ":" + port)
					connectedCallback(socket)
				}.bind(this))
				//Dispatcher expects a messag event from webworker library (i.e. message bound to data field in object)
				socket.on('message',function(data){
					//console.log("Got: " + JSON.stringify(data.message))
					this.messageHandler({data : data.message})
				}.bind(this))
				socket.on('disconnect',function(){
					//TODO
				}.bind(this))
			},

			getConnection: function(address,port){
				return this.connections[address + port]
			},

			hasConnection: 		function(address,port){
				(address + port) in this.connections
			},

			init: 				function(messageHandler){
				this.messageHandler = messageHandler
			}
		}

	}

	return {
		makeSocketManager: makeSocketManager
	}
})