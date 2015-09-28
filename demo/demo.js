Ext.Loader.setConfig ({
	enabled: true,
	paths: {
		'Ext.ux.WebSocket': '../WebSocket.js' ,
		'Ext.ux.WebSocketManager': '../WebSocketManager.js'
	}
});

Ext.require (['Ext.ux.WebSocket', 'Ext.ux.WebSocketManager']);

Ext.define ('DEMO.view.OpenConnection', {
	extend: 'Ext.panel.Panel' ,
	
	title: 'Open a new connection' ,
	width: 300 ,
	layout: 'anchor' ,
	
	openConnection: function (obj) {
		var url = obj.up('panel').down('textfield').getValue ();
		
		var ws = Ext.create ('Ext.ux.WebSocket', {
			url: url ,
			listeners: {
				open: function (ws) {
					var container = Ext.ComponentQuery.query('panel[title="' + url + '"] > container#messageCt')[0];
					var messageBox = container.getEl().dom.getElementsByClassName("messageBox")[0];
					messageBox.innerHTML += '> WebSocket just open!<br/>';
				} ,
				message: function (ws, data) {
					var container = Ext.ComponentQuery.query('panel[title="' + url + '"] > container#messageCt')[0];
					var messageBox = container.getEl().dom.getElementsByClassName("messageBox")[0];
					messageBox.innerHTML += '> ' + data + '<br/>';
				} ,
				close: function (ws) {
					var panel = Ext.ComponentQuery.query('panel[title="' + url + '"]')[0];
					
					if ((panel != null) || (panel != undefined)) {
						panel.destroy ();
					}
				}
			}
		});
		
		// Connection panel
		var panel = Ext.create ('Ext.panel.Panel', {
			title: url ,
			ws: ws ,
			
			layout: 'anchor' ,
			
			bodyPadding: 5 ,
			collapsible: true ,
			
			items: [{
				xtype: 'container' ,
				html: 'Incoming from the server:<br/><div class="messageBox" style="height: 60px; border: black solid 1px; padding: 5px; margin: 5px 0 5px 0; overflow: auto"></div>' ,
				itemId: 'messageCt'
			} , {
				xtype: 'textarea' ,
				labelAlign: 'top' ,
				fieldLabel: 'Send a message' ,
				anchor: '100%'
			}] ,
			
			buttons: [{
				text: 'Reset' ,
				handler: function (btn, evt) {
					btn.up('panel').down('textarea').reset ();
				}
			} , {
				text: 'Send' ,
				handler: function (btn, evt) {
					btn.up('panel').ws.send(btn.up('panel').down('textarea').getValue ());
				}
			}] ,
			
			dockedItems: {
				xtype: 'toolbar' ,
				dock: 'top' ,
				defaults: {
					xtype: 'button'
				} ,
				items: [{
					// Registers to Ext.ux.WebSocketManager
					text: 'Register' ,
					handler: function (btn, evt) {
						if (btn.getText () === 'Register') {
							Ext.ux.WebSocketManager.register (btn.up('toolbar').up('panel').ws);
							btn.setText ('Unregister');
						}
						else {
							Ext.ux.WebSocketManager.unregister (btn.up('toolbar').up('panel').ws);
							btn.setText ('Register');
						}
					}
				} , {
					text: 'Close' ,
					handler: function (btn, evt) {
						btn.up('toolbar').up('panel').ws.close ();
						btn.up('toolbar').up('panel').destroy ();
					}
				}]
			}
		});
		
		Ext.getCmp('connections').add (panel);
	} ,
	
	items: [{
		xtype: 'textfield' ,
		anchor: '100%' ,
		fieldLabel: 'URL' ,
		labelAlign: 'top' ,
		listeners: {
			specialKey: function (tf, evt) {
				if (evt.getKey () === evt.ENTER) {
					this.up('panel').openConnection (tf);
				}
			}
		}
	}] ,
	
	buttons: [{
		text: 'Reset' ,
		handler: function (btn, evt) {
			btn.up('panel').down('textfield').reset ();
		}
	} , {
		text: 'Open' ,
		handler: function (btn) {
			btn.up('panel').openConnection (btn);
		}
	}]
});

Ext.define ('DEMO.view.BroadcastConnection', {
	extend: 'Ext.panel.Panel' ,
	
	title: 'Broadcast Connection' ,
	width: 500 ,
	layout: 'fit' ,
	
	items: [{
		xtype: 'textarea' ,
		fieldLabel: 'Broadcast a message' ,
		labelAlign: 'top' ,
	}] ,
	
	buttons: [{
		text: 'Close any connections' ,
		handler: function (btn, evt) {
			Ext.ux.WebSocketManager.closeAll ();
		}
	} , '->' , {
		text: 'Reset' ,
		handler: function (btn, evt) {
			btn.up('panel').down('textarea').reset ();
		}
	} , {
		// Broadcasts a message
		text: 'Send' ,
		handler: function (btn, evt) {
			Ext.ux.WebSocketManager.broadcast ('BROADCAST: ' + btn.up('panel').down('textarea').getValue ());
		}
	}]
});

Ext.onReady (function () {
	var oc = Ext.create ('DEMO.view.OpenConnection');
	var bc = Ext.create ('DEMO.view.BroadcastConnection');
	
	Ext.create ('Ext.container.Container', {
		renderTo: Ext.getBody () ,
		
		layout: {
			type: 'hbox' ,
			align: 'middle' ,
			pack: 'center'
		} ,
		
		items: [{
			xtype: 'container' ,
			layout: {
				type: 'vbox' ,
				align: 'stretch'
			} ,
			width: 800 ,
			
			items: [{
				xtype: 'panel',
			
				title: 'Demo Ext.ux.WebSocket and Ext.ux.WebSocketManager' ,
		
				layout: {
					type: 'vbox' ,
					align: 'stretch'
				} ,
				
				items: [{
					xtype: 'container' ,
					layout: {
						type: 'hbox' ,
						align: 'stretch'
					} ,
					defaults: {
						bodyPadding: 5
					} ,
					items: [oc, bc]
				} , {
					xtype: 'panel' ,
					title: 'Connections' ,
					id: 'connections' ,
					layout: {
						type: 'vbox' ,
						align: 'stretch'
					}
				}]
			}]
		}]
	});
});
