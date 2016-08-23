require(['VAT'],function(vatModule){
	var systemBehaviour = {
		serverRef: 0,
		highlightRef: 0,
		name: 	0,
		coders: {},

		updateCode: function(rawHTML){
			jQuery('#code').html(rawHTML)
		},

		init: function(){
			console.log("Client system actor loaded")
			var sFut = this.getRemoteRef('localhost',8080)
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
				that.serverRef.newCode(that.name,code)
				var fut = that.highlightRef.highlightCode(code)
				that.onResolve(fut,function(highlightedCode){
					that.updateCode(highlightedCode)
				})
			})
			this.onResolve(sFut,function(ref){
				this.serverRef = ref
				ref.register(name,this)
			})
			window.setActRef(this)
		},

		setupHighlight: function(ref){
			this.highlightRef = ref
		},

		newCoder: function(name,ref){
			var element = "<li onclick=\"setPrivateChoice(\'" + name + "\')\">" + name + "</li>"
			jQuery("#coders-menu").append(element)
			this.coders[name] = ref
		},

		newCode: function(code){
			console.log("Got new code: " + code)
			var fut = this.highlightRef.highlightCode(code)
			this.onResolve(fut,function(highlightedCode){
				console.log("Updating code")
				this.updateCode(highlightedCode)
			})
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
			this.system.setupHighlight(this)
		},

		highlightCode: function(code){
			var highlighted = this.highlightAuto(code).value
			return highlighted
		}
	}
	vatModule(function(actor,systemActor,onResolve,onRuin,killAll){
		systemActor(systemBehaviour)
		actor(highlighter)
	})
})