if (localStorage.accessToken) {
    var graphUrl = "https://graph.facebook.com/me?" + localStorage.accessToken + "&callback=displayUser";
    console.log(graphUrl);

    var script = document.createElement("script");
    script.src = graphUrl;
    document.body.appendChild(script);

    function displayUser(user) {
        console.log(user);
    }
}

window.addEventListener('storage', storageEventHandler, false);

function storageEventHandler(e){
	alert("listener");
	alert(e);
}

chrome.tabs.getCurrent(function callback);

function callback(Tab tab){
	alert("tab");
}