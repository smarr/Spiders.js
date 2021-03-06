var msgHandleModule = require('./messageHandler')
var serialiseModule = require('./serialise')
var messageModule 	= require('./messages')
var futModule 		= require('./futureManagement')
var socketModule 	= require('./socketManagement')
var objectModule 	= require('./objectPool')
var Reflect 		= require('harmony-reflect')
var io 				= require('socket.io')

var socketPort 		= process.argv[2]
var futureManager 	= futModule.makeFutureManager()
var socketManager 	= socketModule.makeSocketManager(io,socketPort)
var objectPool 		= objectModule.makeObjectPool()
var messageHandler 	= msgHandleModule.makeMessageHandler(futureManager,socketManager,objectPool,false,null,null)
socketManager.init(messageHandler)
console.log(socketManager.socketReady)
