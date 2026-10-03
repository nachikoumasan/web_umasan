// Test mode uses the shared production calendar; progress remains in its own storage.
(function(root){
'use strict';
if(new URLSearchParams(location.search).get('test')==='early')root.UmaQuestConfig.isPreflight=true;
})(window);
