var params = document.URL.split('#')[1];
var utoken = params.split('&')[0];

// need to store the utoken in a cookie

window.close();

var friends, _id, pic, data;

var pic_url = addToken('https://graph.facebook.com/me') + '&fields=picture';

$.get(addToken('https://graph.facebook.com/me/friends'), function(res){
	friends = res.data;
	console.log(friends);
	$.get(pic_url, function(res){
		_id = res.id;
		pic = res.picture.data.url;
		console.log(_id,pic);
		data = { id : _id, friends: friends, picture : pic };
		
		var socket = io.connect('http://localhost');
		socket.emit('user_log', data);
	});
});

function addToken(url){
	return url = url + '?' + utoken; 
}

