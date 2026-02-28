// 'document' is the global object that represents the HTML page.
// document.getElementById('some-id') is like querySelector — it finds
// an HTML element by its id attribute and returns it as an object you can
// read or change.
// =============================================================================

// =============================================================================
// PAGE 1 FUNCTIONS — Welcome / CSV Setup
// These functions live on welcome.html and handle loading or creating the CSV.
// =============================================================================

// handleFileUpload() — Runs when the user clicks "Upload Log" and picks a file.
// It reads the CSV file from their computer and saves the text into the browser's
// localStorage so it can be accessed on other pages without a server.
function handleFileUpload() {

    // document.getElementById('csvFile') finds the hidden <input type="file"> in
    // your HTML by its id. We save it in a const because we only need to read it.
    const fileInput = document.getElementById('csvFile');

    // .files is a list of all files the user selected. [0] gets the first one.
    // In Java this would be like fileInput.getFiles().get(0).
    const file = fileInput.files[0];

    // If no file was chosen, 'file' will be undefined (falsy in JS), so this
    // check prevents the rest of the function from running on nothing.
    if (file) {

        // FileReader is a built-in browser class (like a Java class) that can
        // read files from the user's computer asynchronously — meaning the browser
        // doesn't freeze while it reads. In Java you'd use FileReader/BufferedReader
        // from java.io — same idea, different syntax.
        const reader = new FileReader();

        // .onload is an event handler — a function that AUTOMATICALLY runs when
        // the FileReader finishes reading. Think of it like implementing a Java
        // interface method that gets called when an event fires.
        // 'e' is the event object; e.target.result is the file's text content.
        reader.onload = function(e) {
            const csvContent = e.target.result;

            // localStorage is the browser's built-in key-value storage. It persists
            // across pages and even browser restarts (unlike regular variables).
            // .setItem(key, value) stores a string under that key name.
            // Think of it like a HashMap<String,String> that the browser saves for you.
            // KEY RESOURCE: https://www.taniarascia.com/how-to-use-local-storage-with-javascript/
            localStorage.setItem('arcanalyzer_spread', csvContent);

            // Redirect the user to the options page once the file is loaded.
            // window.location.href is how you navigate to a different page in JS.
            window.location.href = 'options.html';
            //^ Q
        };

        // This STARTS the reading process. It triggers the .onload function above
        // once it's done. readAsText reads the file as a plain text string.
        reader.readAsText(file);
    }
}


// createNewLog() — Runs when the user clicks "New SpreadSheet".
// Instead of loading an existing file, it creates a blank CSV header string
// and saves it to localStorage, then redirects to options.
function createNewLog() {

    // This string is the first row of a CSV file — the column headers.
    // Each value separated by a comma = one column in the spreadsheet.
    const headers = "Date,Spread_Key,Arcana_Type,Card_Name,Number,Suit,Element,Planet,Numerology,Energy";

    // Save the header-only CSV to localStorage as the starting point.
    localStorage.setItem('arcanalyzer_spread', headers);

    // Send the user to the options page.
    window.location.href = 'options.html';
}


// =============================================================================
// PAGE 3 FUNCTIONS — New Spread (new.html)
// =============================================================================


// --- GLOBAL VARIABLES FOR THIS PAGE ---
// These are declared OUTSIDE of any function so they persist for the whole
// session on this page. In Java terms, think of them as instance variables
// at the top of a class.
document.getElementById('current-cards').style.display = 'none';

// currentSessionCards is an array (like an ArrayList in Java) that holds
// all the card objects the user adds before clicking "Complete Spread".
let currentSessionCards = [];

// FIX: This was generated inside submitCard(), meaning every card got a
// DIFFERENT spread key. We generate it ONCE here so all cards in this
// session share the same key, letting you group them as one spread later.
let currentSpreadKey = "Spread-" + Date.now();
// Date.now() returns the current time in milliseconds since 1970 (Unix timestamp).
// It's a quick way to make a unique ID. e.g., "Spread-1708123456789"


// rankNames is a lookup table (like a HashMap<String,String> in Java) that
// maps the numeric value of the minor-rank dropdown to a display name.
// FIX: Without this, submitting "11 of Cups" would display "11 of Cups" instead
// of "Page of Cups" because the option VALUES are numbers, not words.
const rankNames = {
    "1": "Ace", "2": "2",  "3": "3",    "4": "4",  "5": "5",
    "6": "6",   "7": "7",  "8": "8",    "9": "9",  "10": "10",
    "11": "Page", "12": "Knight", "13": "Queen", "14": "King"
};

// --- NAVIGATION FUNCTIONS ---

// goToStep2() — Called by the "NEXT" button in step-1.
// Reads the arcana-select dropdown, hides step 1, and shows the correct step 2.
function goToStep2() {

    // .getElementById finds the <select> tag with id="arcana-select".
    // .value reads whatever option is currently selected — "major" or "minor".
    const arcanaType = document.getElementById('arcana-select').value;

    // .style.display lets you show/hide elements with CSS display rules.
    // Setting it to 'none' is the JS equivalent of adding display:none in CSS.
    // FIX (HTML NOTE): step-2-major and step-2-minor should also be styled with
    // display:flex in CSS (not just display:block) to match how step-1 is styled.
    document.getElementById('step-2-major').style.display = 'none';
    document.getElementById('step-2-minor').style.display = 'none';
    document.getElementById('step-1').style.display = 'none';

    // Ternary-style if/else: show the major panel OR the minor panel.
    if (arcanaType === 'major') {
        // '===' is strict equality in JS — checks value AND type (like .equals() in Java).
        // Always prefer '===' over '==' in JS to avoid unexpected type coercion.
        document.getElementById('step-2-major').style.display = 'flex';
        document.getElementById('step-2-major').style.flexDirection = 'column';
        document.getElementById('step-2-major').style.alignItems = 'center';
        
    } else {
        document.getElementById('step-2-minor').style.display = 'flex';
        document.getElementById('step-2-minor').style.flexDirection = 'column';
        document.getElementById('step-2-minor').style.alignItems = 'center';
    }
}

// goBackToStep1() — Called by both "Back" buttons.
// Hides whichever step-2 panel is showing and brings back step-1.
function goBackToStep1() {

    // We hide BOTH step-2 panels to be safe, regardless of which one is showing.
    document.getElementById('step-2-major').style.display = 'none';
    document.getElementById('step-2-minor').style.display = 'none';

    document.getElementById('step-1').style.display = 'flex';
}

// --- CARD SUBMISSION ---
// submitCard(type) — Called by the "Submit Card" button on either step-2 panel.
// 'type' will be either the string 'Major' or 'Minor', passed in from the HTML
// button's onclick attribute: onclick="submitCard('Major')"
function submitCard(type) {

    // Declare variables to fill in differently depending on Major vs Minor.
    // In Java: String cardName, suit, element; int rank, numberVal;
    document.getElementById('current-cards').style.display = 'flex';
    document.getElementById('current-cards').style.flexDirection = 'column';
    document.getElementById('current-cards').style.alignItems = 'center';
    let cardName, suit, rank, element, numberVal;

    if (type === 'Major') {

        // FIX: Your original code did:
        //   const fullValue = document.getElementById('major-card-select').value;
        //   cardName = fullValue.split(' - ')[1];
        // BUT .value on a <select> only returns the VALUE attribute of the option
        // (e.g., "0"), not the visible text (e.g., "0 - The Fool").
        // To get the visible text, you access the OPTIONS list and use selectedIndex.

        // Get the actual <select> element so we can read both value and text.
        const selectEl = document.getElementById('major-card-select');

        // .options is a list of all the <option> elements inside the <select>.
        // .selectedIndex is the index number of the currently chosen option.
        // So selectEl.options[selectEl.selectedIndex] gives us the selected <option>.
        // .text gives us the visible label — e.g., "0 - The Fool"
        const fullText = selectEl.options[selectEl.selectedIndex].text;

        // String .split(' - ') divides the string at ' - ' and returns an array.
        // "0 - The Fool".split(' - ') => ["0", "The Fool"]
        // [1] gets the second element — the name. [0] would be the number.
        cardName = fullText.split(' - ')[1];   // e.g., "The Fool"
        rank     = selectEl.value;             // e.g., "0" (the option's value attr)
        suit     = "Major";
        element  = "Ether";                    // Placeholder — expand later if you want
        numberVal = parseInt(rank);            // Convert string "0" to integer 0

    } else { // type === 'Minor'

        // For minor cards, .value is fine here because these dropdowns use
        // number strings as values and we handle display naming with rankNames.
        rank = document.getElementById('minor-rank').value;   // e.g., "11"
        suit = document.getElementById('minor-suit').value;   // e.g., "Cups"

        // FIX: Use the rankNames lookup table to get "Page" instead of "11".
        // rankNames["11"] returns "Page" — same concept as a HashMap.get("11") in Java.
        const rankLabel = rankNames[rank];
        cardName = `${rankLabel} of ${suit}`;  // e.g., "Page of Cups"
        // Template literals (backtick strings) work like Java's String.format()
        // or string interpolation — ${variable} inserts the variable's value.

        // Map suit names to classical elements using if-else chain.
        if (suit === "Wands")     element = "Fire";
        if (suit === "Cups")      element = "Water";
        if (suit === "Swords")    element = "Air";
        if (suit === "Pentacles") element = "Earth";

        // parseInt() converts a string like "11" to the integer 11.
        // This is important because .value always returns a string in JS,
        // just like reading a Scanner in Java gives you strings you then parse.
        numberVal = parseInt(rank);
    }

    // Build a card object — in JS, objects are like anonymous/inline classes.
    // {key: value, key: value} is called an "object literal". Think of it
    // like a Map<String, Object> or a simple data class/struct.
    const cardObj = {
        date:       new Date().toLocaleDateString(), // Today's date as a readable string
        spreadKey:  currentSpreadKey,                // FIX: shared key for the whole spread
        arcana:     type,                            // "Major" or "Minor"
        name:       cardName,                        // e.g., "The Fool" or "Page of Cups"
        number:     numberVal,                       // Numeric rank
        suit:       suit,                            // e.g., "Cups" or "Major"
        element:    element,                         // e.g., "Water"
        planet:     "N/A",                           // Placeholder for future expansion
        numerology: numberVal,                       // Same as number for now
        energy:     "Neutral"                        // Placeholder for future expansion
    };

    // .push() adds the new card object to the END of the array.
    // Like ArrayList.add() in Java.
    currentSessionCards.push(cardObj);

    // --- Update the visual card list in the UI ---
    // This is the DOM manipulation section. We're building an HTML element
    // with JavaScript and inserting it into the page without reloading.
    // KEY RESOURCE: https://www.javascripttutorial.net/javascript-dom/javascript-appendchild/

    // document.createElement('li') creates a new <li> element in memory
    // (not yet on the page). Like calling new ListItem() conceptually.
    const li = document.createElement('li');

    // .className sets the class attribute on the element.
    // This adds Bootstrap's list-group-item styling + flexbox utility classes.
    li.className = "card-entry list-group-item d-flex justify-content-between align-items-center";

    // .innerHTML lets you set the HTML CONTENT inside the <li>.
    // We're creating: a span with the card name, and a Bootstrap badge showing the element.
    // The badge color is hardcoded as 'bg-primary' (blue) — consider using different
    // colors per element (e.g., red for Fire, blue for Water, etc.) for visual flair.
    li.innerHTML = `
        <span>${cardName}</span>
     `;

    // document.getElementById('visual-card-list') finds the <ul> in your HTML.
    // .appendChild(li) inserts our new <li> as the last child of that <ul>.
    // This is what actually makes it appear on the page.
    document.getElementById('visual-card-list').appendChild(li);

    // Send the wizard back to step 1 so the user can add another card.
    goBackToStep1();

    // Show the "Complete Spread" button now that there's at least one card.
    document.getElementById('open-modal');
}


// --- COMPLETING THE SPREAD ---

// completeSpread() — Called when the user clicks "Complete Spread".
// Converts all collected card objects into CSV rows and saves them to localStorage.
function completeSpread() {

    // Retrieve whatever CSV content was saved from Page 1.
    // .getItem(key) retrieves the stored string by key name.
    // If nothing was stored (key doesn't exist), it returns null.
    // The '|| ""' means: "if null, use an empty string instead" (fallback).
    // This is JavaScript's version of a null-coalescing default.
    let csvContent = localStorage.getItem('arcanalyzer_spread') || "";

    // .forEach() is like a for-each loop in Java: it iterates over every
    // element in the array and runs the provided function for each one.
    // 'card' is the loop variable — each card object from currentSessionCards.
    currentSessionCards.forEach(card => {

        // Build a CSV row string by accessing each property of the card object.
        // The backtick template literal lets us embed variables inline.
        // Each value is comma-separated to match the CSV header columns.
        // '\n' adds a newline before each row, just like in Java's println.
        const row = `\n${card.date},${card.spreadKey},${card.arcana},${card.name},${card.number},${card.suit},${card.element},${card.planet},${card.numerology},${card.energy}`;

        // += appends the new row to the existing CSV string (string concatenation).
        csvContent += row;
    });

    // Save the updated CSV (with all the new cards appended) back to localStorage.
    localStorage.setItem('arcanalyzer_spread', csvContent);

    // Once saved, redirect to the view or stats page.
    // You can change this to 'view.html' if you'd rather go there first.
    const openButton = document.getElementById('open-modal');
    const closeButton = document.getElementById('close-modal');
    const modal = document.getElementById('my-modal');


    openButton.addEventListener('click', () => {
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.flexWrap = 'nowrap';
        modal.style.alignContent = 'stretch';
        modal.style.alignItems = 'center';
        modal.style.backgroundColor = 'cornsilk'
        modal.style.width = '60%'
        modal.style.boxShadow = '0px 5px 5px  #00000085'
        modal.showModal(); // Displays the dialog as a modal
    });

    closeButton.addEventListener('click', () => {
        window.location.href='options.html'
        modal.close(); // Closes the dialog
    });
}

// =============================================================================
// UTILITY — CSV DOWNLOAD
// This function can be called from any page to trigger a download of the CSV.
// It's currently not wired up to a button, but it works when called.
// To use it: downloadUpdatedCsv(localStorage.getItem('arcanalyzer_spread'))
// =============================================================================

// downloadUpdatedCsv(content) — Takes a CSV string and makes the browser
// download it as a file. No server needed — it's all done client-side.
function downloadUpdatedCsv(content) {

    // Blob is a browser object for raw binary/text data.
    // Think of it as wrapping your string in a file-like container.
    // The second argument sets the MIME type so the browser knows it's a CSV.
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

    // URL.createObjectURL() creates a temporary in-memory URL pointing to the Blob.
    // It's like a fake download link generated on the fly.
    const url = URL.createObjectURL(blob);

    // Create a hidden <a> link element, set its href to the blob URL,
    // and set the download filename. Then programmatically click it.
    // This is the standard JS trick for triggering file downloads.
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'arcanalyzer_spread.csv');
    link.style.visibility = 'hidden';     // Hide it so the user doesn't see it
    document.body.appendChild(link);      // Must be in the DOM to be clickable
    link.click();                          // Simulate a click to trigger download
    document.body.removeChild(link);       // Clean it up after clicking
}


/************************** PAGE FOUR LOGIC - VIEW PAGE *******************************/

function displayAsTable() {
    // 1. Pull the data from localStorage
    const csvContent = localStorage.getItem('arcanalyzer_spread');

    // 2. Check if the data actually exists to avoid errors
    if (!csvContent) {
        console.log("No CSV data found in localStorage.");
        return;
    }

    const rows = csvContent.trim().split('\n');
    const tableBody = document.getElementById('tableBody');
    const tableHeaders = document.getElementById('tableHeaders');

    // Clear existing content so it doesn't double-up if the page refreshes
    tableBody.innerHTML = "";
    tableHeaders.innerHTML = "";

    // 3. Extract headers (first row)
    const headers = rows[0].split(',');
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        tableHeaders.appendChild(th);
    });

    // 4. Extract data rows
    for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split(',');
        // Skip empty lines or malformed rows
        if (columns.length === headers.length) {
            const tr = document.createElement('tr');
            columns.forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        }
    }
}