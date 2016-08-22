define(function(){
	var makeObjectPool = function(){
		var id 		= 1
		var pool 	= {} 
		return {
			behaviourId: 0,

			newObject: function(obj){
				var obId 	= id
				pool[obId] 	= obj
				id 			+= 1
				return obId
			},

			getObject: function(id){
				return pool[id]
			},

			setBehaviour: function(behObj){
				pool[this.behaviourId] = behObj
			},

			getBehaviour: function(){
				return pool[this.behaviourId]
			}
		}
	}

	return{
		makeObjectPool: makeObjectPool
	}
})