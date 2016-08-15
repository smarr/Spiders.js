define(function() {

	var makeFutureManager = function(){
		futurePool			= 0
		resolved			= {}
		ruined 				= {}
		resolvedListeners	= {}
		ruinedListeners 	= {}

		return {
			//Future are actually just integer IDs which allows us to pass them to workers without needing to serialise the future object
			makeFuture 	: function(){
				futurePool 		   		   	   += 1
				var futureId 					= futurePool
				resolvedListeners[futureId] 	= []
				ruinedListeners[futureId]		= []
				return futureId
			},

			resolve		: function(future,val){
				if(!(future in resolved)){
					var callbacks = resolvedListeners[future]
					for(i in callbacks){
						var callback = callbacks[i]
						callback(val)
					}
					resolved[future] = val
				}
			},

			ruin		: function(future,exception){
				if(!(future in ruined)){
					var callbacks = ruinedListeners[future]
					for(i in callbacks){
						var callback = callbacks[i]
						callback(exception)
					}
					ruined[future] = exception
				}
				
			},

			onResolve	: function(future,callback){
				if(future in resolved){
					callback(resolved[future])
				}
				else{
					var current = resolvedListeners[future]
					current.push(callback.bind(this))
				}
			},

			onRuin 		: function(future,callback){
				if(future in ruined){
					callback(ruined[future])
				}
				else{
					var current = ruinedListeners[future]
					current.push(callback.bind(this))
				}
			}
		}
	}

	return {
		makeFutureManager: makeFutureManager,
	}
})