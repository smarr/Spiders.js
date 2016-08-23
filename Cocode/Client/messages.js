define(function() {

	//////////////////////////////////
	//Messages sent by system actor //
	//////////////////////////////////

	//Init message
	var initTag 			= "init"
	var makeInitMsg			= function(systemIp,systemId,actorId){
		return {tag: initTag, systemIp: systemIp, systemId: systemId, actorId: actorId}
	}
	var initMsgSystemIp 	= function(initMsg){
		return initMsg.systemIp
	}
	var initMsgSystemId 	= function(initMsg){
		return initMsg.systemId
	}
	var initMsgActorId		= function(initMsg){
		return initMsg.actorId
	}
	var isInitMsg			= function(msg){
		return msg.tag == initTag
	}
	//Inject Behaviour message
	var injectTag			= "inject"
	var makeInjectMsg 		= function(actorBehaviour,systemBehaviour){
		return {tag: injectTag,actorBehaviour: actorBehaviour,systemBehaviour: systemBehaviour}
	}
	var injectActorBeh 		= function(injectMsg){
		return injectMsg.actorBehaviour
	} 
	var injectSystemBeh 	= function(injectMsg){
		return injectMsg.systemBehaviour
	}
	var isInjectMsg 		= function(msg){
		return msg.tag == injectTag
	}
	//Channel opened message
	var channelOpenTag		= "channelOpen"
	var makeChannelOpenMsg	= function(actorId){
		return {tag: channelOpenTag, actorId: actorId}
	}
	var channelOpenMsgId	= function(channelOpenMsg){
		return channelOpenMsg.actorId
	}
	var isChannelOpenMsg	= function(msg){
		return msg.tag == channelOpenTag
	}

	//////////////////////////////////
	//Messages sent to system actor //
	//////////////////////////////////

	//Loaded message
	var loadedTag			= "loaded"
	var makeLoadedMsg		= function(){
		return {tag: loadedTag}
	}
	var isLoadedMsg			= function(msg){
		return msg.tag == loadedTag
	}

	var importedTag 		= "imported"
	var makeImportedMsg 	= function(){
		return {tag: importedTag}
	}
	var isImportedMsg		= function(msg){
		return msg.tag == importedTag
	}
	
	//Log message
	var logTag				= "log"
	var makeLogMsg			= function(logMessage){
		return {tag: logTag, message: logMessage}
	}
	var logMsgMessage		= function(logMsg){
		return logMsg.message
	}
	var isLogMsg			= function(msg){
		return msg.tag == logTag
	}

	//////////////////////////////////
	//Messages sent between  actors //
	//////////////////////////////////

	//Access
	var accessTag			= "access"
	var makeAccessMsg		= function(fieldName,actorId,objectId,future){
		return {tag: accessTag, fieldName: fieldName, actorId: actorId,  objectId: objectId, future: future}
	}
	var accessMsgName		= function(accessMsg){
		return accessMsg.fieldName
	}
	var accessMsgActorId 	= function(accessMsg){
		return accessMsg.actorId
	}
	var accessMsgObjectId 	= function(accessMsg){
		return accessMsg.objectId
	}
	var accessMsgFuture		= function(accessMsg){
		return accessMsg.future
	}
	var isAccessMsg			= function(msg){
		return msg.tag == accessTag
	}
	//Invocation
	var callTag				= "call"
	var makeCallMsg			= function(methodName,methodArgs,actorId,objectId,future){
		return {tag: callTag, name: methodName, args: methodArgs,actorId: actorId, objectId: objectId, future: future}
	}
	var callMsgName			= function(callMsg){
		return callMsg.name
	}
	var callMsgArgs			= function(callMsg){
		return callMsg.args
	}
	var callMsgActorId 		= function(callMsg){
		return callMsg.actorId
	}
	var callMsgObjectId 	= function(callMsg){
		return callMsg.objectId
	}
	var callMsgFuture 		= function(callMsg){
		return callMsg.future
	}
	var isCallMsg			= function(msg){
		return msg.tag == callTag
	}

	//Resolve future message
	var resolveTag			= "resolve"
	var makeResolveMsg		= function(future,value){
		return {tag: resolveTag, future: future, val: value}
	}
	var resolveMsgFuture	= function(resolveMsg){
		return resolveMsg.future
	}
	var resolveMsgVal		= function(resolveMsg){
		return resolveMsg.val
	}
	var isResolveMsg		= function(msg){
		return msg.tag == resolveTag
	}

	//Ruin future message
	var ruinTag 			= "ruin"
	var makeRuinMsg 		= function(future,exception){
		return {tag: ruinTag, future: future, exception: exception}
	}
	var ruinMsgFuture 		= function(ruinMsg){
		return ruinMsg.future
	}
	var ruinMsgException 	= function(ruinMsg){
		return ruinMsg.exception
	}
	var isRuinMsg 			= function(msg){
		return msg.tag == ruinTag
	}

	//////////////////////////////////
	//Remote Messages 				//
	//////////////////////////////////

	var getRemoteTag 		= "getRemoteRef"
	var makeGetRemoteMsg 	= function(fromId,future,isBrowser,fromAddress,fromPort){
		return {tag: getRemoteTag, fromId: fromId, future: future,isBrowser: isBrowser,fromAddress: fromAddress,fromPort: fromPort}
	}
	var getRemoteFromId 	= function(getRemoteMsg){
		return getRemoteMsg.fromId
	}
	var getRemoteFuture 	= function(getRemoteMsg){
		return getRemoteMsg.future
	}
	var getRemoteIsBrowser 	= function(getRemoteMsg){
		return getRemoteMsg.isBrowser
	}
	var getRemoteFromAddress = function(getRemoteMsg){
		return getRemoteMsg.fromAddress
	}
	var getRemoteFromPort 	= function(getRemoteMsg){
		return getRemoteMsg.fromPort
	}
	var isGetRemoteMsg 		= function(msg){
		return msg.tag == getRemoteTag
	}

	var browserRemoteAccessTag 		= "browserRemoteAccess"
	var makeBrowserRemoteAccessMsg 	= function(fieldName,fromId,objectId,future){
		return {tag: browserRemoteAccessTag,fieldName: fieldName,fromId: fromId,objectId: objectId,future: future}
	}
	var browserRemoteAccessName 	= function(browserRemoteAccessMsg){
		return browserRemoteAccessMsg.fieldName
	}
	var browserRemoteAccessFromId 	= function(browserRemoteAccessMsg){
		return browserRemoteAccessMsg.fromId
	}
	var browserRemoteAccessObjectId = function(browserRemoteAccessMsg){
		return browserRemoteAccessMsg.objectId
	}
	var browserRemoteAccessFuture 	= function(browserRemoteAccessMsg){
		return browserRemoteAccessMsg.future
	}
	var isBrowserRemoteAccessMsg 	= function(msg){
		return msg.tag == browserRemoteAccessTag
	}

	var browserRemoteCallTag 		= "browserRemoteCall"
	var makeBrowserRemoteCallMsg	= function(methodName,methodArgs,fromId,objectId,future){
		return {tag: browserRemoteCallTag,methodName: methodName,methodArgs: methodArgs,fromId: fromId,objectId: objectId,future: future}
	}
	var browserRemoteCallName 		= function(browserRemoteCallMsg){
		return browserRemoteCallMsg.methodName
	}
	var browserRemoteCallArgs 		= function(browserRemoteCallMsg){
		return browserRemoteCallMsg.methodArgs
	}
	var browserRemoteCallFromId 	= function(browserRemoteCallMsg){
		return browserRemoteCallMsg.fromId
	}
	var browserRemoteCallObjectId 	= function(browserRemoteCallMsg){
		return browserRemoteCallMsg.objectId
	}
	var browserRemoteCallFuture 	= function(browserRemoteCallMsg){
		return browserRemoteCallMsg.future
	}
	var isBrowserRemoteCallMsg 		= function(msg){
		return msg.tag == browserRemoteCallTag
	}

	var remoteAccessTag 		= "remoteAccess"
	var makeRemoteAccessMsg 	= function(fieldName,fromRef,objectId,future){
		return {tag: remoteAccessTag,fieldName: fieldName,fromRef: fromRef,objectId: objectId,future: future}
	}
	var remoteAccessName		= function(remoteAccessMsg){
		return remoteAccessMsg.fieldName
	}
	var remoteAccessFromRef 	= function(remoteAccessMsg){
		return remoteAccessMsg.fromRef
	}
	var remoteAccessObjectId 	= function(remoteAccessMsg){
		return remoteAccessMsg.objectId
	}
	var remoteAccessFuture 		= function(remoteAccessMsg){
		return remoteAccessMsg.future
	}
	var isRemoteAccessMsg 		= function(msg){
		return msg.tag == remoteAccessTag
	}

	var remoteCallTag 			= "remoteCall"
	var makeRemoteCallMsg 		= function(methodName,methodArgs,fromRef,objectId,future){
		return {tag: remoteCallTag,methodName: methodName,methodArgs: methodArgs,fromRef: fromRef,objectId: objectId,future: future}
	}
	var remoteCallName 			= function(remoteCallMsg){
		return remoteCallMsg.methodName
	}
	var remoteCallArgs 			= function(remoteCallMsg){
		return remoteCallMsg.methodArgs
	}
	var remoteCallFromRef 		= function(remoteCallMsg){
		return remoteCallMsg.fromRef
	}
	var remoteCallObjectId 		= function(remoteCallMsg){
		return remoteCallMsg.objectId
	}
	var remoteCallFuture 		= function(remoteCallMsg){
		return remoteCallMsg.future
	}
	var isRemoteCallMsg 		= function(msg){
		return msg.tag == remoteCallTag
	}

	var peerRemoteCallTag 			= "peerRemoteCall"
	var makePeerRemoteCallMsg 		= function(methodName,methodArgs,fromId,objectId,future){
		return {tag: peerRemoteCallTag,methodName: methodName,methodArgs: methodArgs,fromId: fromId,objectId: objectId,future: future}
	}
	var peerRemoteCallName 			= function(peerRemoteCallMsg){
		return peerRemoteCallMsg.methodName
	}
	var peerRemoteCallArgs 			= function(peerRemoteCallMsg){
		return peerRemoteCallMsg.methodArgs
	}
	var peerRemoteCallFromId 		= function(peerRemoteCallMsg){
		return peerRemoteCallMsg.fromId
	}
	var peerRemoteCallObjectId 		= function(peerRemoteCallMsg){
		return peerRemoteCallMsg.objectId
	}
	var peerRemoteCallFuture		= function(peerRemoteCallMsg){
		return peerRemoteCallMsg.future
	}
	var setPeerRemoteCallRouteAdd 	= function(peerRemoteCallMsg,address){
		peerRemoteCallMsg.routeAddress 	= address
	}
	var peerRemoteCallRouteAdd 		= function(peerRemoteCallMsg){
		return peerRemoteCallMsg.routeAddress
	}
	var setPeerRemoteCallRoutePort 	= function(peerRemoteCallMsg,port){
		peerRemoteCallMsg.routePort 	= port
	}
	var peerRemoteCallRoutePort 	= function(peerRemoteCallMsg){
		return peerRemoteCallMsg.routePort
	}
	var isPeerRemoteCallMsg 		= function(msg){
		return msg.tag == peerRemoteCallTag
	}

	var peerRemoteAccessTag 		= "peerRemoteAccess"
	var makePeerRemoteAccessMsg 	= function(fieldName,fromId,objectId,future){
		return {tag: peerRemoteAccessTag,fieldName: fieldName,fromId: fromId,objectId: objectId,future: future}
	}
	var peerRemoteAccessName 		= function(peerRemoteAccessMsg){
		return peerRemoteAccessMsg.fieldName
	}
	var peerRemoteAccessFromId 	= function(peerRemoteAccessMsg){
		return peerRemoteAccessMsg.fromId
	}
	var peerRemoteAccessObjectId 	= function(peerRemoteAccessMsg){
		return peerRemoteAccessMsg.objectId
	}
	var peerRemoteAccessFuture 		= function(peerRemoteAccessMsg){
		return peerRemoteAccessMsg.future
	}
	var setPeerRemoteAccessRouteAdd = function(peerRemoteAccessMsg,address){
		peerRemoteAccessMsg.routeAddress = address
	}
	var peerRemoteAccessRouteAdd 	= function(peerRemoteAccessMsg){
		return peerRemoteAccessMsg.routeAddress
	}
	var setPeerRemoteAccessRoutePort = function(peerRemoteAccessMsg,port){
		peerRemoteAccessMsg.routePort = port
	}
	var peerRemoteAccessRoutePort 	= function(peerRemoteAccessMsg){
		return peerRemoteAccessMsg.routePort
	}
	var isPeerRemoteAccessMsg 		= function(msg){
		msg.tag == peerRemoteAccessTag
	}

	var routeTag 					= "routeMsg"
	var makeRouteMsg 				= function(fromId,toId,targetId,message){
		return {tag: routeTag,fromId: fromId,toId: toId,targetId : targetId,message: message}
	}
	var routeFromId 				= function(routeMsg){
		return routeMsg.fromId
	}
	var routeToId 					= function(routeMsg){
		return routeMsg.toId
	}
	var routeTargetId 				= function(routeMsg){
		return routeMsg.targetId
	}
	var routeMessage 				= function(routeMsg){
		return routeMsg.message
	}
	var isRouteMsg 					= function(msg){
		return msg.tag == routeTag
	}

  	return {
    	makeInitMsg: 					makeInitMsg,
    	initMsgSystemIp: 				initMsgSystemIp,
    	initMsgSystemId: 				initMsgSystemId,
    	initMsgActorId: 				initMsgActorId,
    	isInitMsg: 						isInitMsg,

    	makeInjectMsg: 					makeInjectMsg,
    	injectActorBeh: 				injectActorBeh,
    	injectSystemBeh: 				injectSystemBeh,
    	isInjectMsg: 					isInjectMsg,

    	makeChannelOpenMsg: 			makeChannelOpenMsg,
    	channelOpenMsgId: 				channelOpenMsgId,
    	isChannelOpenMsg: 				isChannelOpenMsg,

    	makeLoadedMsg: 					makeLoadedMsg,
    	isLoadedMsg: 					isLoadedMsg,

    	makeImportedMsg: 				makeImportedMsg,
    	isImportedMsg: 					isImportedMsg,
    	
    	makeLogMsg:  					makeLogMsg,
    	logMsgMessage: 					logMsgMessage,
    	isLogMsg: 						isLogMsg,

    	makeAccessMsg: 					makeAccessMsg,
    	accessMsgName: 					accessMsgName,
    	accessMsgActorId: 				accessMsgActorId,
    	accessMsgObjectId: 				accessMsgObjectId,
    	accessMsgFuture: 				accessMsgFuture,
    	isAccessMsg: 					isAccessMsg,

    	makeCallMsg: 					makeCallMsg,
    	callMsgName: 					callMsgName,
    	callMsgArgs: 					callMsgArgs,
    	callMsgActorId: 				callMsgActorId,
    	callMsgObjectId: 				callMsgObjectId,
    	callMsgFuture: 					callMsgFuture,
    	isCallMsg: 						isCallMsg,

    	makeResolveMsg: 				makeResolveMsg,
    	resolveMsgFuture: 				resolveMsgFuture,
    	resolveMsgVal: 					resolveMsgVal,
    	isResolveMsg: 					isResolveMsg,

    	makeRuinMsg: 					makeRuinMsg,
    	ruinMsgFuture: 					ruinMsgFuture,
    	ruinMsgException: 				ruinMsgException,
    	isRuinMsg: 						isRuinMsg,

    	makeGetRemoteMsg: 				makeGetRemoteMsg,
    	getRemoteFuture: 				getRemoteFuture,
    	getRemoteFromId: 				getRemoteFromId,
    	getRemoteIsBrowser: 			getRemoteIsBrowser,
    	isGetRemoteMsg: 				isGetRemoteMsg,

    	makeBrowserRemoteAccessMsg: 	makeBrowserRemoteAccessMsg,
    	browserRemoteAccessName: 		browserRemoteAccessName,
    	browserRemoteAccessFromId: 		browserRemoteAccessFromId,
    	browserRemoteAccessObjectId: 	browserRemoteAccessObjectId,
    	browserRemoteAccessFuture: 		browserRemoteAccessFuture,
    	isBrowserRemoteAccessMsg: 		isBrowserRemoteAccessMsg, 

    	makeBrowserRemoteCallMsg: 		makeBrowserRemoteCallMsg,
    	browserRemoteCallName: 			browserRemoteCallName,
    	browserRemoteCallFromId: 		browserRemoteCallFromId,
    	browserRemoteCallObjectId: 		browserRemoteCallObjectId,
    	browserRemoteCallFuture: 		browserRemoteCallFuture,

    	makeRemoteAccessMsg: 			makeRemoteAccessMsg,
    	remoteAccessName: 				remoteAccessName,
    	remoteAccessFromRef: 			remoteAccessFromRef,
    	remoteAccessObjectId: 			remoteAccessObjectId,
    	remoteAccessFuture: 			remoteAccessFuture,
    	isRemoteAccessMsg: 				isRemoteAccessMsg,

    	makeRemoteCallMsg: 				makeRemoteCallMsg,
    	remoteCallName: 				remoteCallName,
    	remoteCallArgs: 				remoteCallArgs,
    	remoteCallFromRef: 				remoteCallFromRef,
    	remoteCallObjectId: 			remoteCallObjectId,
    	remoteCallFuture: 				remoteCallFuture,
    	isRemoteCallMsg: 				isRemoteCallMsg,

    	makePeerRemoteAccessMsg: 		makePeerRemoteAccessMsg,
    	peerRemoteAccessName: 			peerRemoteAccessName,
    	peerRemoteAccessFromId: 		peerRemoteAccessFromId,
    	peerRemoteAccessObjectId: 		peerRemoteAccessObjectId,
    	peerRemoteAccessFuture: 		peerRemoteAccessFuture,
    	setPeerRemoteAccessRouteAdd: 	setPeerRemoteAccessRouteAdd,
    	setPeerRemoteAccessRoutePort: 	setPeerRemoteAccessRoutePort,
    	peerRemoteAccessRouteAdd: 		peerRemoteAccessRouteAdd,
    	peerRemoteAccessRoutePort: 		peerRemoteAccessRoutePort,
    	isPeerRemoteAccessMsg: 			isPeerRemoteAccessMsg,

    	makePeerRemoteCallMsg: 			makePeerRemoteCallMsg,
    	peerRemoteCallName: 			peerRemoteCallName,
    	peerRemoteCallArgs: 			peerRemoteCallArgs,
    	peerRemoteCallFromId: 			peerRemoteCallFromId,
    	peerRemoteCallObjectId: 		peerRemoteCallObjectId,
    	peerRemoteCallFuture: 			peerRemoteCallFuture,
    	setPeerRemoteCallRouteAdd: 		setPeerRemoteCallRouteAdd,
    	setPeerRemoteCallRoutePort: 	setPeerRemoteCallRoutePort,
    	peerRemoteCallRouteAdd: 		peerRemoteCallRouteAdd,
    	peerRemoteCallRoutePort: 		peerRemoteCallRoutePort,
    	isPeerRemoteCallMsg: 			isPeerRemoteCallMsg,

    	makeRouteMsg: 					makeRouteMsg,
    	routeFromId: 					routeFromId,
    	routeToId: 						routeToId,
    	routeTargetId: 					routeTargetId,
    	routeMessage: 					routeMessage,
    	isRouteMsg: 					isRouteMsg,
  	};
});