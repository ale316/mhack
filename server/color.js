var colors = ['#1ABC9C','#16A085','#2ECC71','#27AE60','#3498DB','#2980B9',
				'#9B59B6','#8E44AD','#34495E','#F39C12','#D35400','#E67E22',
				'#E74C3C','#C0392B','#7F8C8D'];
// nice flatUI colors

var numColors = colors.length;

function genPrettyColors(str){
	var a = str.charCodeAt(0) ? str.charCodeAt(0) : 1;
	var b = str.charCodeAt(1) ? str.charCodeAt(1) : 2;
	var c = str.charCodeAt(2) ? str.charCodeAt(2) : 3;
	var index = (a*b*c)%numColors;
	return colors[index];
}

alert(genPrettyColors("top tech"));