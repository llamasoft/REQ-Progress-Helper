// ==UserScript==
// @name        REQ Progress Helper
// @version     1.0.6
// @namespace   https://github.com/llamasoft
// @supportURL  https://github.com/llamasoft/REQ-Progress-Helper
// @updateURL   https://llamasoft.github.io/REQ-Progress-Helper/REQHelper.user.js
// @include     https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/requisitions/categories/customization*
// @include     https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/requisitions/categories/loadout*
// @include     https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/requisitions/categories/powerandvehicle*
// @require     https://code.jquery.com/jquery-1.12.0.min.js
// @run-at      document-idle
// ==/UserScript==
'use strict';


var HaloItem = function (element) {
    var safeLower = function(v) { return (v || '').toLowerCase(); }

    this.id        = $(element).attr('data-id');
    this.name      = $(element).attr('data-name');
    this.desc      = $(element).attr('data-description');
    this.category  = $(element).attr('data-subcategory');
    this.rarity    = $(element).attr('data-rarity');
    this.owned     = safeLower($(element).attr('data-have-owned')) == 'true';
    this.durable   = safeLower($(element).attr('data-is-durable')) == 'true';
    this.certified = safeLower($(element).attr('data-has-certification')) == 'true';
};

HaloItem.prototype.unlocked = function () {
    // "Unlocked" is different for non-durable (i.e. usable) items
    // If an item is usable, then you "own" it if you've ever received one,
    //   but you haven't "unlocked" it until you're certified

    if (this.durable) {
        // If reuable (loadout, armor, emblem, ...) then ownership is unlock status
        return this.owned;

    } else {
        // If usable, certification is unlock status
        return this.certified;
    }
};



// In Halo 5 there are items which are "hidden"
// They only appear in the item listing if you have them unlocked,
//   otherwise they simply don't show up
// These items mess with the alignment of this script's output
//   when compared to the master item list of the REQ Worksheet
// To work around this, we occasionally need to inject these
//   "hidden" items directly into the item listing with dummy values
function fakeItem(properties) {
    var fakeItem = new HaloItem('<button>');
    $.extend(true, fakeItem, properties);

    return fakeItem;
}


// Inserts item into myItems[category] after afterID and before beforeID
// If afterID or beforeID is null, only one will be considerd, not both
function injectItem(myItems, category, afterID, beforeID, newItem) {
    var pos = 0;
    var len = myItems[category].length;
    var found = false;

    // Scan the item list to make sure our item isn't already included
    for (pos = 0; pos < len; pos++) {
        if (myItems[category][pos].id == newItem.id) {
            console.log('No need to inject, item already exists');
            return true;
        }
    }


    // Before first item
    if (!afterID && myItems[category][0] == beforeID) {
        pos = 0;
        found = true;
    }

    // After last item
    if (!beforeID && myItems[category][len - 1] == afterID) {
        pos = length;
        found = true;
    }

    // Between two items
    for (pos = 1; pos < len && !found; pos++) {
        if ( (!afterID  || myItems[category][pos - 1].id == afterID )
          && (!beforeID || myItems[category][pos    ].id == beforeID) ) {
            found = true;
            break;
        }
    }

    if (!found) {
        showMsg('Item injection failed, see console for information', 60 * 1000);
        console.error('Item injection failed, please contact the developer');
        console.error('category:', category);
        console.error('afterID:',  afterID );
        console.error('beforeID:', beforeID);
        console.error(JSON.stringify(myItems[category]));
        return false;
    }


    // Add the new item in the correct position
    console.log('Item injected at position', pos);
    console.log('Current value', myItems[category][pos]);
    myItems[category].splice(pos, 0, newItem);
    return true;
}



// Returns the owned and total count of all items in a category
function getProgress(category) {
    return myItems[category].reduce(
        function (curSum, curItem, i) {
            return {
                have:  (curSum.have  || 0) + (curItem.unlocked() ? 1 : 0),
                total: (curSum.total || 0) + 1
            };
        },
        {}
    );
}


// Credit: http://stackoverflow.com/a/30810322/477563
function copyToClipboard(text) {
    var textArea = document.createElement("textarea");

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top  = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width  = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border    = 'none';
    textArea.style.outline   = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';

    // Create the element and select its text
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
    } finally {
        document.body.removeChild(textArea);
    }
}


// Converts the items within a category to X/Blank for easy pasting
function buildCopyText(category) {
    return myItems[category].map(
        function (item) { return (item.unlocked() ? 'X' : ''); }
    ).join('\n') + '\n';
}


// Display a message and fade it out
function showMsg(text, duration) {
    var resetStyle = function (elem) {
        $(elem).stop().show().css('opacity', 1);
    }

    // Cancel any animations and reset to full visibility
    resetStyle('#REQHelperStatus');

    // Set the content and begin a fade out
    // On completion, reset to "Ready" message
    $('#REQHelperStatus').html(text);
    $('#REQHelperStatus').fadeOut(
        duration || 5000,
        function () { resetStyle(this); $(this).html('Ready'); }
    );
}


// Creates a copy button for a given category and adds it to the header
function buildPasteButton(category) {
    var categoryName = categoryMapping[category] || category;
    var progress = getProgress(category);

    var copyButton = $('<a/>')
        .addClass('button')
        .css('margin', '2px')
        .text(categoryName +'s ('+ progress.have +' / '+ progress.total +')')
        .click(
            function () {
                var reqProgress = buildCopyText(category);
                try {
                    copyToClipboard(reqProgress);
                    showMsg(category + ' progress copied to clipboard');

                } catch (e) {
                    showMsg('Failed to copy REQ progress to clipboard, manually copy from JavaScript console');
                    console.log(category + ' REQ progress:\n' + 'BEGIN\n' + reqProgress + 'END');
                }
            }
        )
    ;

    $('div#REQHelperBtns').append(copyButton);
}


// Things that 343i named differently than the community
// Yes, 343i forgot to give loadout weapons a category
var categoryMapping = {
    'ArmorSuit':     'Armor',
    'WeaponSkin':    'Weapon Skin',
    '':              'Loadout',
    'PowerWeapon':   'Power Weapon',
    'Equipment':     'Power Up'
};


// Gather the REQs on the current page
var myItems = {};
$('div.card button').each(
    function () {
        var curItem = new HaloItem($(this));

        // Skip any "Random" REQs
        if (curItem.name.indexOf('Random') !== -1) { return; }

        // If the item category hasn't been created yet, make it
        if ( !(curItem.category in myItems) ) {
            myItems[curItem.category] = [];
        }

        myItems[curItem.category].push(curItem);
    }
);

// Turns out that some items are hidden
// Unless you own them, they don't even appear in the item listing
// Here we try to inject them, but this method isn't great and is probably prone to breaking
injectItem(myItems, 'WeaponSkin',
    // Between Spirit of Fire AR and Blue Team AR
    '87009bbc-20c8-41a4-8f5e-9885ce113e1f', '8a20aa5b-dab1-4598-996c-ebb35da91b5d',
    fakeItem({
        id: '406455f4-9f3e-4979-9feb-aef414f536c6',
        name: '343 Industries - Assault Rifle'
    })
);

injectItem(myItems, 'WeaponSkin',
    // Between 343 Industries AR and Blue Team AR
    '406455f4-9f3e-4979-9feb-aef414f536c6', '8a20aa5b-dab1-4598-996c-ebb35da91b5d',
    fakeItem({
        id: 'd6bd073f-f0ec-4b91-b6b7-656607595b96',
        name: '343 Industries - Magnum'
    })
);



// Build a place to put the REQ copy buttons
$('div#REQHelperMain').remove();
$('div.req-collection').prepend(
    '<div id="REQHelperMain" class="region">'
  +   '<div id="REQHelperBtns" class="content">'
  +     '<p class="text--smallest">Use these buttons to copy your REQ progress</p>'
  +     '<hr></hr>'
  +   '</div>'
  +   '<div class="content text--smallest">'
  +     '&gt; <span id="REQHelperStatus">Ready</span>'
  +   '</div>'
  + '</div>'
);


// Add the REQ copy buttons
Object.keys(myItems).forEach(
    function (category) {
        buildPasteButton(category);
    }
);
