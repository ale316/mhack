var socket = io.connect('http://localhost:7076');
socket.emit('my other event', { my: 'data' });
socket.on('user_logged', function(r) {
	console.log(r);
});