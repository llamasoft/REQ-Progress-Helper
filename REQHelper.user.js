// ==UserScript==
// @name        REQ Progress Helper
// @version     1.0.2
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
    this.id        = $(element).attr('data-id');
    this.name      = $(element).attr('data-name');
    this.desc      = $(element).attr('data-description');
    this.owned     = $(element).attr('data-have-owned').toLowerCase() == 'true';
    this.category  = $(element).attr('data-subcategory');
    this.durable   = $(element).attr('data-is-durable').toLowerCase() == 'true';
    this.rarity    = $(element).attr('data-rarity');
    this.certified = $(element).attr('data-has-certification').toLowerCase() == 'true';
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


// Converts the items within a category to X/Blank for easy pasting
function buildPasteText(category) {
    return myItems[category].map(
        function (item) { return (item.owned ? 'X' : ''); }
    ).join('\n');
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
                window.prompt(
                    'Copy and paste this into REQ Progress:',
                    buildPasteText(category)
                );
            }
        )
    ;

    $('div#REQHelper div.content').append(copyButton);
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

        // If the item category hasn't been created yet, make it
        if ( !(curItem.category in myItems) ) {
            myItems[curItem.category] = [];
        }

        myItems[curItem.category].push(curItem);
    }
);


// Build a place to put the REQ copy buttons
$('div#REQHelper').remove();
$('div.req-collection').prepend(
    '<div id="REQHelper" class="region">'
  +   '<div class="content">'
  +     '<p class="text--smallest">Use these buttons to copy your REQ progress</p>'
  +     '<hr></hr>'
  +   '</div>'
  + '</div>'
);


// Add the REQ copy buttons
Object.keys(myItems).forEach(
    function (category) {
        buildPasteButton(category);
    }
);
