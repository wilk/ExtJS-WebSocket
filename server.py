#! /usr/bin/env python

from tornado import websocket
from tornado import web
from tornado import ioloop
import json
import sys

class EchoWebSocket (websocket.WebSocketHandler):
	def open (self):
		print 'WebSocket open!'
	
	def on_message (self, message):
		self.write_message (message)
		print 'He sais: ' + message
	
	def on_close (self):
		print 'WebSocket closed'

if __name__ == '__main__':
	if (len (sys.argv) <= 1):
		print 'Usage: $ python server.py <port1> <port2> <port3> ...'
		print 'Example: $ python server.py 8888 9999 10000'
		print 'Exit'
	else:
		app = [0]
		
		[app.append (web.Application ([(r"/", EchoWebSocket)])) for i in range (1, len (sys.argv))]
		
		[app[i].listen (int (sys.argv[i])) for i in range (1, len (sys.argv))]
		
		for i in range (1, len (sys.argv)):
			print 'Server listening at %d' % int (sys.argv[i])
		
		ioloop.IOLoop.instance().start ()
