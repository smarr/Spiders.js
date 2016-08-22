require(['VAT'],function(vatModule){
	var systemBehaviour = {
		serverRef: null,
		name: 	null,
		coders: {},

		updateCode: function(rawHTML){
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
			jQuery('#privateSendButton').click(function(){
				var to = window.privateChoice
				var text = jQuery('#privateMessageText').val()
				jQuery('#privateMessageText').val("")
				that.sendPrivateMessage(to,text)
			})
			jQuery('#highlightCodeButton').click(function(){
				var code = jQuery('#code').text()
				var high = window.hljs.highlightAuto(code).value
				that.updateCode(high)
			})
			this.onResolve(fut,function(ref){
				this.serverRef = ref
				ref.register(name,this)
			})
			window.setActRef(this)
		},

		newCoder: function(name,ref){
			var element = "<li onclick=\"setPrivateChoice(\'" + name + "\')\">" + name + "</li>"
			jQuery("#coders-menu").append(element)
			this.coders[name] = ref
		},

		newCode: function(code){
			var rxp = /&lt;(.+)&gt;(.+)&lt;\/(.+)&gt;/ig
			if(rxp.test(code)){
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
			window.alert("Coder: " + message.from + " sent: " + message.message)
		},

		sendPublicMessage: function(text){
			this.serverRef.publicMessage(this.isolate({from: this.name,message: text}))
		},

		sendPrivateMessage: function(to,text){
			var ref = this.coders[to]
			ref.newPrivateMessage(this.isolate({from: this.name,message: text}))
		}
	}

	var highlighter = {
		imports: ['./highlight/highlight.pack.js'],
		init: function(){
			console.log("New highlighter created")
		}
	}
	vatModule(function(actor,systemActor,onResolve,onRuin,killAll){
		systemActor(systemBehaviour)
		actor(highlighter,"highlighter")
	})
})