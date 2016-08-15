importScripts('socket-io.js');
importScripts('require.js');
require(['messages','channelManagement','messageHandler','futureManagement','socketManagement','objectPool'], function(msgModule,channelModule,msgHandleModule,futModule,sockModule,objectModule) {
var futureManager 	= futModule.makeFutureManager()
var channelManager 	= channelModule.makeManager()
var socketManager 	= sockModule.makeSocketManager()
var objectPool 		= objectModule.makeObjectPool()
var messageHandler 	= msgHandleModule.makeMessageHandler(channelManager,socketManager,futureManager,objectPool,false,null,null)
socketManager.init(messageHandler)

onmessage = messageHandler

//Notify system actor that dependencies have been loaded
postMessage(msgModule.makeLoadedMsg())

});