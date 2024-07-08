# Sheexcel Module - Excel in your Sheets

## Overview

The Sheexcel Module for Foundry Virtual Tabletop (VTT) seamlessly integrates Google Sheets into your game sessions, allowing you to use spreadsheets as part of your character sheets within Foundry VTT. With Sheexcel, you can manage your game data in real-time, directly from Google Sheets, enhancing your gameplay experience with dynamic and interactive spreadsheets.

## Features

- **Real-Time Data Sync**: Keep your game data synchronized between Foundry VTT and Google Sheets.
- **Customizable Sheets**: Utilize Google Sheets' extensive formatting options directly within Foundry VTT.
- **Easy Integration**: Simple setup process to integrate Google Sheets URLs into your game entities.
- **Zoom**: Zoom in and out of the spreadsheet without effecting any zoom of your Foundry VTT client.
- **Makro Capability**: Use defined cells as values/modifiers within your makros.

## Known Issues

- **Resizing**: While minimizing the sheet, if you drag too fast you will hover over the spreadsheet and resizing will stop. Solution: Drag slowly.
- **Not Editable**: Your share link needs to have edit permissions to be able to edit the spreadsheet.

## Installation

To install the Sheexcel Module, follow these steps:

1. Copy this link: https://raw.githubusercontent.com/muhahahahe/foundry-sheexcel-module/main/src/module.json
2. Open Foundry VTT Setup and navigate to the "Add-On Modules" section.
3. Click on "Install Module", paste the link in the bottom field and hit the "Install" button.
4. Activate the Sheexcel Module in the Game World.

## Usage

After installing the Sheexcel Module, you can start using it by following these steps:

1. Create or open a Character Sheet.
2. Open the Sheet Configuration and select Sheexcel for "This Sheet".
3. Navigate to the "Spreedsheet" tab where you'll find a new field for entering a Google Sheet URL.
4. Enter the URL of your Google Spreadsheet (*IMPORTANT!* This needs to be a generated share link!) and click the update button.

## References

1. Manage cell values with the help of the sheets sidebar.
2. Create a makro with the type script.
Example Makro:
- In the example the actor has a stored cell with the keyword `WeaponMod`
```JavaScript
// Get the selected token
let selectedToken = canvas.tokens.controlled[0];

if (!selectedToken) {
  ui.notifications.warn("Please select a token first.");
  return;
}

let actor = selectedToken.actor;

if (!actor) {
  ui.notifications.error("The selected token has no associated actor.");
  return;
}

// Get the "WeaponMod" value from Sheexcel
let reference = game.sheexcel.getSheexcelValue(actor.id, "WeaponMod");
if (!reference.value) {
  ui.notifications.warn("No 'WeaponMod' value found in the Sheexcel sheet. Make sure you have a cell reference with the keyword 'WeaponMod'.");
  return;
}

// Parse the roll value and create a Roll object
let roll = new Roll(`1d20 + ${reference.value.toString()}`);

// Execute the roll
roll.evaluate().then(() => {
  // Create the chat message content with detailed roll information
  let messageContent = `<h2>${actor.name} makes an attack roll!</h2>`;
  
  // Add roll formula
  messageContent += `<p><strong>Roll Formula:</strong> ${roll.formula}</p>`;
  
  // Add individual term results
  messageContent += `<p><strong>Term Results:</strong></p><ul>`;
  roll.terms.forEach(term => {
    if (term instanceof Die) {
      messageContent += `<li>Dice (${term.number}d${term.faces}): ${term.total}</li>`;
    } else if (term instanceof NumericTerm) {
      messageContent += `<li>Modifier: ${term.number}</li>`;
    }
  });
  messageContent += `</ul>`;
  
  // Add total
  messageContent += `<p><strong>Total:</strong> ${roll.total}</p>`;

  // Create a chat message
  ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({token: selectedToken}),
    content: messageContent,
    rolls: roll
  });
});
```

## Customization

For advanced customization, such as modifying the appearance of the spreadsheet within Foundry VTT, you can edit the `sheexcel.css` file located in the module's directory.

## Support & Contributions

If you encounter any issues or have suggestions for improvements, please create an issue on the [GitHub repository](https://github.com/muhahahahe/foundry-sheexcel-module/issues). Contributions to the project are welcome!

## License

This module is licensed under the MIT License. See the `LICENSE` file for more details.