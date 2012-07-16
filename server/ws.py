#! /usr/bin/env python

from tornado import websocket
from tornado import web
from tornado import ioloop
import json
import sys

class EchoWebSocket (websocket.WebSocketHandler):
	def open (self):
		print 'WebSocket opened!'
	
	def on_message (self, message):
		self.write_message (message)
		print 'He sais: ' + message
	
	def on_close (self):
		print 'WebSocket closed'

if __name__ == '__main__':
	app = web.Application ([
		(r"/", EchoWebSocket),
	])
	if (len (sys.argv) >= 2):
		port = int (sys.argv[1])
	else:
		port = 8888
	app.listen (port)
	print 'Server listening at %d' % port
	ioloop.IOLoop.instance().start ()
