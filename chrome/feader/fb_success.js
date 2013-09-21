var params = document.URL.split('#')[1];
var utoken = params.split('&')[0];

// window.close();

var data = $.get(addToken('https://graph.facebook.com/me/friends'), function(res){
	console.log(res);
});

 function addToken(url){
 	return url = url + '?' + utoken; 
 }
