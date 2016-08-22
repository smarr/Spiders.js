////////////////////////
//Messages Module    //
///////////////////////

//////////////////////////////////
//Messages sent by system actor //
//////////////////////////////////

//Init message
var initTag 			= "init"
exports.makeInitMsg		= function(systemIp,systemId,actorId){
	return {tag: initTag, systemIp: systemIp, systemId: systemId, actorId: actorId}
}
exports.initMsgSystemIp = function(initMsg){
	return initMsg.systemIp
}
exports.initMsgSystemId = function(initMsg){
	return initMsg.systemId
}
exports.initMsgActorId	= function(initMsg){
	return initMsg.actorId
}
exports.isInitMsg		= function(msg){
	return msg.tag == initTag
}
//Inject Behaviour message
var injectTag			= "inject"
exports.makeInjectMsg 	= function(actorBehaviour,systemBehaviour){
	return {tag: injectTag,actorBehaviour: actorBehaviour,systemBehaviour: systemBehaviour}
}
exports.injectActorBeh 	= function(injectMsg){
	return injectMsg.actorBehaviour
} 
exports.injectSystemBeh = function(injectMsg){
	return injectMsg.systemBehaviour
}
exports.isInjectMsg 	= function(msg){
	return msg.tag == injectTag
}
//Channel opened message
var channelOpenTag		= "channelOpen"
exports.makeChannelOpenMsg	= function(actorId,socketPort){
	return {tag: channelOpenTag, actorId: actorId,socketPort: socketPort}
}
exports.channelOpenMsgId	= function(channelOpenMsg){
	return channelOpenMsg.actorId
}
exports.channelOpenMsgSocketPort = function(channelOpenMsg){
	return channelOpenMsg.socketPort
}
exports.isChannelOpenMsg	= function(msg){
	return msg.tag == channelOpenTag
}


//////////////////////////////////
//Messages sent between  actors //
//////////////////////////////////

//Resolve future message
var resolveTag			= "resolve"
exports.makeResolveMsg		= function(future,value){
	return {tag: resolveTag, future: future, val: value}
}
exports.resolveMsgFuture	= function(resolveMsg){
	return resolveMsg.future
}
exports.resolveMsgVal		= function(resolveMsg){
	return resolveMsg.val
}
exports.isResolveMsg		= function(msg){
	return msg.tag == resolveTag
}

//Ruin future message
var ruinTag 			= "ruin"
exports.makeRuinMsg 		= function(future,exception){
	return {tag: ruinTag, future: future, exception: exception}
}
exports.ruinMsgFuture 		= function(ruinMsg){
	return ruinMsg.future
}
exports.ruinMsgException 	= function(ruinMsg){
	return ruinMsg.exception
}
exports.isRuinMsg 			= function(msg){
	return msg.tag == ruinTag
}


//////////////////////////////////
//Remote Messages 				//
//////////////////////////////////

var getRemoteTag 		= "getRemoteRef"
exports.makeGetRemoteMsg 	= function(fromId,future,isBrowser,fromAddress,fromPort){
	return {tag: getRemoteTag,fromId: fromId,future: future,isBrowser: isBrowser,fromAddress: fromAddress,fromPort: fromPort}
}
exports.getRemoteFromId 	= function(getRemoteMsg){
	return getRemoteMsg.fromId
}
exports.getRemoteFuture 	= function(getRemoteMsg){
	return getRemoteMsg.future
}
exports.getRemoteIsBrowser 	= function(getRemoteMsg){
	return getRemoteMsg.isBrowser
}
exports.getRemoteFromAddress = function(getRemoteMsg){
	return getRemoteMsg.fromAddress
}
exports.getRemoteFromPort 	= function(getRemoteMsg){
	return getRemoteMsg.fromPort
}
exports.isGetRemoteMsg 		= function(msg){
	return msg.tag == getRemoteTag
}

var remoteAccessTag 		= "remoteAccess"
exports.makeRemoteAccessMsg 	= function(fieldName,fromRef,objectId,future){
	return {tag: remoteAccessTag,fieldName: fieldName,fromRef: fromRef,objectId: objectId,future: future}
}
exports.remoteAccessName		= function(remoteAccessMsg){
	return remoteAccessMsg.fieldName
}
exports.remoteAccessFromRef 	= function(remoteAccessMsg){
	return remoteAccessMsg.fromRef
}
exports.remoteAccessObjectId 	= function(remoteAccessMsg){
	return remoteAccessMsg.objectId
}
exports.remoteAccessFuture 		= function(remoteAccessMsg){
	return remoteAccessMsg.future
}
exports.isRemoteAccessMsg 		= function(msg){
	return msg.tag == remoteAccessTag
}

var remoteCallTag 			= "remoteCall"
exports.makeRemoteCallMsg 		= function(methodName,methodArgs,fromRef,objectId,future){
	return {tag: remoteCallTag,methodName: methodName,methodArgs: methodArgs,fromRef: fromRef,objectId: objectId,future: future}
}
exports.remoteCallName 			= function(remoteCallMsg){
	return remoteCallMsg.methodName
}
exports.remoteCallArgs 			= function(remoteCallMsg){
	return remoteCallMsg.methodArgs
}
exports.remoteCallFromRef 		= function(remoteCallMsg){
	return remoteCallMsg.fromRef
}
exports.remoteCallObjectId 		= function(remoteCallMsg){
	return remoteCallMsg.objectId
}
exports.remoteCallFuture 		= function(remoteCallMsg){
	return remoteCallMsg.future
}
exports.isRemoteCallMsg 		= function(msg){
	return msg.tag == remoteCallTag
}

//////////////////////////////////////////////
//Remote Messages from browsers				//
//////////////////////////////////////////////

var browserRemoteAccessTag 		= "browserRemoteAccess"
exports.makeBrowserRemoteAccessMsg 	= function(fieldName,fromId,objectId,future){
	return {tag: remoteAccessTag,fieldName: fieldName,fromId: fromId,objectId: objectId,future: future}
}
exports.browserRemoteAccessName 	= function(browserRemoteAccessMsg){
	return browserRemoteAccessMsg.fieldName
}
exports.browserRemoteAccessFromId 	= function(browserRemoteAccessMsg){
	return browserRemoteAccessMsg.fromId
}
exports.browserRemoteAccessObjectId = function(browserRemoteAccessMsg){
	return browserRemoteAccessMsg.objectId
}
exports.browserRemoteAccessFuture 	= function(browserRemoteAccessMsg){
	return browserRemoteAccessMsg.future
}
exports.isBrowserRemoteAccessMsg 	= function(msg){
	return msg.tag == browserRemoteAccessTag
}

var browserRemoteCallTag 		= "browserRemoteCall"
exports.makeBrowserRemoteCallMsg	= function(methodName,methodArgs,fromId,objectId,future){
	return {tag: remoteCallTag,methodName: methodName,methodArgs: methodArgs,fromId: fromId,objectId: objectId,future: future}
}
exports.browserRemoteCallName 		= function(browserRemoteCallMsg){
	return browserRemoteCallMsg.methodName
}
exports.browserRemoteCallArgs 		= function(browserRemoteCallMsg){
	return browserRemoteCallMsg.methodArgs
}
exports.browserRemoteCallFromId 	= function(browserRemoteCallMsg){
	return browserRemoteCallMsg.fromId
}
exports.browserRemoteCallObjectId 	= function(browserRemoteCallMsg){
	return browserRemoteCallMsg.objectId
}
exports.browserRemoteCallFuture 	= function(browserRemoteCallMsg){
	return browserRemoteCallMsg.future
}
exports.isBrowserRemoteCallMsg 		= function(msg){
	return msg.tag == browserRemoteCallTag
}

var routeTag 						= "routeMsg"
exports.makeRouteMsg 				= function(fromId,toId,targetId,message){
	return {tag: routeTag,fromId: fromId,toId: toId,targetId: targetId,message: message}
}
exports.routeFromId 				= function(routeMsg){
	return routeMsg.fromId
}
exports.routeToId 					= function(routeMsg){
	return routeMsg.toId
}
exports.routeTargetId 				= function(routeMsg){
	return routeMsg.targetId
}
exports.routeMessage 				= function(routeMsg){
	return routeMsg.message
}
exports.isRouteMsg 					= function(msg){
	return msg.tag == routeTag
}

var peerRemoteCallTag 				= "peerRemoteCall"
exports.makePeerRemoteCallMsg 		= function(methodName,methodArgs,fromId,objectId,future){
	return {tag: peerRemoteCallTag,methodName: methodName,methodArgs: methodArgs,fromId: fromId,objectId: objectId,future: future}
}
exports.peerRemoteCallName 			= function(peerRemoteCallMsg){
	return peerRemoteCallMsg.methodName
}
exports.peerRemoteCallArgs 			= function(peerRemoteCallMsg){
	return peerRemoteCallMsg.methodArgs
}
exports.peerRemoteCallFromId 		= function(peerRemoteCallMsg){
	return peerRemoteCallMsg.fromId
}
exports.peerRemoteCallObjectId 		= function(peerRemoteCallMsg){
	return peerRemoteCallMsg.objectId
}
exports.peerRemoteCallFuture		= function(peerRemoteCallMsg){
	return peerRemoteCallMsg.future
}
exports.setPeerRemoteCallRouteAdd 	= function(peerRemoteCallMsg,address){
	peerRemoteCallMsg.routeAddress 	= address
}
exports.peerRemoteCallRouteAdd 		= function(peerRemoteCallMsg){
	return peerRemoteCallMsg.routeAddress
}
exports.setPeerRemoteCallRoutePort 	= function(peerRemoteCallMsg,port){
	peerRemoteCallMsg.routePort 	= port
}
exports.peerRemoteCallRoutePort 	= function(peerRemoteCallMsg){
	return peerRemoteCallMsg.routePort
}
exports.isPeerRemoteCallMsg 		= function(msg){
	return msg.tag == peerRemoteCallTag
}

var peerRemoteAccessTag 		= "peerRemoteAccess"
exports.makePeerRemoteAccessMsg 	= function(fieldName,fromId,objectId,future){
	return {tag: peerRemoteAccessTag,fieldName: fieldName,fromId: fromId,objectId: objectId,future: future}
}
exports.peerRemoteAccessName 		= function(peerRemoteAccessMsg){
	return peerRemoteAccessMsg.fieldName
}
exports.peerRemoteAccessFromId 		= function(peerRemoteAccessMsg){
	return peerRemoteAccessMsg.fromId
}
exports.peerRemoteAccessObjectId 	= function(peerRemoteAccessMsg){
	return peerRemoteAccessMsg.objectId
}
exports.peerRemoteAccessFuture 		= function(peerRemoteAccessMsg){
	return peerRemoteAccessMsg.future
}
exports.setPeerRemoteAccessRouteAdd = function(peerRemoteAccessMsg,address){
	peerRemoteAccessMsg.routeAddress = address
}
exports.peerRemoteAccessRouteAdd 	= function(peerRemoteAccessMsg){
	return peerRemoteAccessMsg.routeAddress
}
exports.setPeerRemoteAccessRoutePort = function(peerRemoteAccessMsg,port){
	peerRemoteAccessMsg.routePort = port
}
exports.peerRemoteAccessRoutePort 	= function(peerRemoteAccessMsg){
	return peerRemoteAccessMsg.routePort
}
exports.isPeerRemoteAccessMsg 		= function(msg){
	msg.tag == peerRemoteAccessTag
}