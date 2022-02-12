# Privacy Policy
We respect your privacy and your freedom to choose right. So
we won't collect any personal identifiable information without your 
acknowledgements and fullpermission.
## Collected data
 If you need to share any of your data like browser/device informations
incase of reporting we will definitely help to you understand what's sharing and not.
### In 404 reporting button
 Check following information listing included in error reporting button located at 404 error pages.
- Browser Name
<p id="name"></p>

- Version 
<p id="version"></p>

- Error facing URL


<script>
var browserName = (function (agent) {        switch (true) {
            case agent.indexOf("edge") > -1: return "MS Edge";
            case agent.indexOf("edg/") > -1: return "Edge ( chromium based)";
            case agent.indexOf("opr") > -1 && !!window.opr: return "Opera";
            case agent.indexOf("chrome") > -1 && !!window.chrome: return "Chrome";
            case agent.indexOf("trident") > -1: return "MS IE";
            case agent.indexOf("firefox") > -1: return "Mozilla Firefox";
            case agent.indexOf("safari") > -1: return "Safari";
            default: return "other";
        }
    })(window.navigator.userAgent.toLowerCase());
function isBrave() {
  if (window.navigator.brave != undefined) {
    if (window.navigator.brave.isBrave.name == "isBrave") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

if(isBrave){
    browserName = "Brave (chromium based)";
}
browserName += " Browser";
var version = navigator.appVersion;

//load

document.getElementById("name").innerHTML = "browser: "+ browserName;
document.getElementById("version").innerHTML = "Supported Versions: " + version;

</script>
