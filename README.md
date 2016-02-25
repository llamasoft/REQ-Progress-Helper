# REQ Progress Helper
A JavaScript utility to help sync your Halo 5 requisition progress with the [REQ Progress worksheet](https://docs.google.com/spreadsheets/d/1pYEm151mtG6ylJr2uTCIGhKh2S8fwSQxwhreYsG0TWY/) by [/u/Fenris447](https://www.reddit.com/user/Fenris447/)

This UserScript requires requires [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) or [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) (or a bookmarklet) and that you use the "[sorted by Waypoint](https://docs.google.com/spreadsheets/d/1pYEm151mtG6ylJr2uTCIGhKh2S8fwSQxwhreYsG0TWY/)" version of the REQ Progress worksheet.


#### UserScript Installation

If you have Greasemonkey/Tampermonkey installed, simply visit this page and install the script:  
https://llamasoft.github.io/REQ-Progress-Helper/REQHelper.user.js


#### Bookmarklet Installation

Make a new bookmark and call it "REQ Progress Helper".  Edit the bookmark and replace the entire URL portion with:

    javascript:(function(){ $.getScript('https://llamasoft.github.io/REQ-Progress-Helper/REQHelper.user.js'); })();


### Usage

If you are using the **UserScript method**, visit the [requisition page](https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/requisitions/categories/customization?ownedOnly=False) and the buttons should load automatically.  
If you're using the **bookmarklet method**, visit the page and click the bookmark and the buttons will load.  
If done correctly, the page should look like this:  https://i.imgur.com/iXhSFmE.png

Click any of the buttons and copy the text from the popup: https://i.imgur.com/CVioH1O.png

Paste the result first cell of the "Have" column: https://i.imgur.com/EfoyhdT.png

Repeat for each category on each of the requisition pages (Customization, Loadout, and Power/Vehicle).
