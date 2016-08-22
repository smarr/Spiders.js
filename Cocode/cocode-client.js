require(['VAT'],function(vatModule){
	var systemBehaviour = {
		serverRef: null,
		name: 	null,

		updateCode: function(rawHTML){
			/*var rxp = /&lt;(.+)&gt;(.+)&lt;\/(.+)&gt;/ig
			if(rxp.test(rawHTML)){
				console.log("New code: " + rawHTML)
				console.log("Replaced: " + rawHTML.replace(rxp,"<$1>$2</$3>"))
				console.log("Original: " + rawHTML.replace(rxp,"$2"))
				var parsed = rawHTML.replace(rxp,"<$1>$2</$3>")
				jQuery('#code').html(parsed);
			}
			else{
				jQuery('#code').html(rawHTML)
			}*/
			jQuery('#code').html(rawHTML)
		},

		init: function(){
			console.log("Client system actor loaded")
			var fut = this.getRemoteRef('localhost',8080)
			var name = jQuery('#name').val()
			this.name = name
			var that = this
			jQuery('#publicSendButton').click(function(){
				that.sendPublicMessage(jQuery('#publicMessageText').val())
				jQuery('#publicMessageText').val("")
			})
			jQuery('#highlightCodeButton').click(function(){
				var code = jQuery('#code').text()
				//window.hljs.configure({useBR: true});
				var high = window.hljs.highlightAuto(code).value
				console.log("Highlighted: " + high)
				that.updateCode(high)
			})
			this.onResolve(fut,function(ref){
				this.serverRef = ref
				ref.register(name,this)
			})
			this.onRuin(fut,function(err){
				//TODO
			})
			window.setActRef(this)
		},

		newCoder: function(name){
			jQuery("#coders-menu").append("<li>" + name + "</li>")
		},

		newCode: function(code){
			var rxp = /&lt;(.+)&gt;(.+)&lt;\/(.+)&gt;/ig
			if(rxp.test(code)){
				console.log("New code: " + code)
				console.log("Replaced: " + code.replace(rxp,"<$1>$2</$3>"))
				console.log("Original: " + code.replace(rxp,"$2"))
				var parsed = code.replace(rxp,"<$1>$2</$3>")
				jQuery('#code').html(parsed);
			}
		},

		newPublicMessage: function(message){
			var from  = message.from
			var txt = message.message
			jQuery("#publicChat").val(jQuery("#publicChat").val() + from + ": " + txt + " \n")
		},

		newPrivateMessage: function(message){
			//TODO
		},

		sendPublicMessage: function(text){
			console.log("Sending public message: " + text)
			this.serverRef.publicMessage(this.isolate({from: this.name,message: text}))
		},

		sendPrivateMessage: function(to,text){
			//TODO
		}
	}

	var highlighter = {
		init: function(){
			console.log("New highlighter created")
		}

	}
	vatModule(function(actor,systemActor,onResolve,onRuin,killAll){
		systemActor(systemBehaviour)
		actor(highlighter)
	})
})