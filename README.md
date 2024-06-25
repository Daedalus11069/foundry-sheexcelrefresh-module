# Sheexcel Module - Excel in your Sheets

## Overview

The Sheexcel Module for Foundry Virtual Tabletop (VTT) seamlessly integrates Google Sheets into your game sessions, allowing you to use spreadsheets as part of your character sheets within Foundry VTT. With Sheexcel, you can manage your game data in real-time, directly from Google Sheets, enhancing your gameplay experience with dynamic and interactive spreadsheets.

**WIP** - preserving your systems default sheet in its own tab

## Features

- **Real-Time Data Sync**: Keep your game data synchronized between Foundry VTT and Google Sheets.
- **Customizable Sheets**: Utilize Google Sheets' extensive formatting options directly within Foundry VTT.
- **Easy Integration**: Simple setup process to integrate Google Sheets URLs into your game entities.
- **Zoom**: Zoom in and out of the spreadsheet without effecting any zoom of your Foundry VTT client.

## Known Issues

- **Resizing**: While minimizing the sheet, if you drag too fast you will hover over the spreadsheet and resizing will stop. Solution: Drag slowly.

## Installation

To install the Sheexcel Module, follow these steps:

1. Copy this link: https://raw.githubusercontent.com/muhahahahe/foundry-sheexcel-module/main/src/module.json
2. Open Foundry VTT Setup and navigate to the "Add-On Modules" section.
3. Click on "Install Module", paste the link in the bottom field and hit the "Install" button.

## Usage

After installing the Sheexcel Module, you can start using it by following these steps:

1. Create or open a Character Sheet.
2. Open the Sheet Configuration and select Sheexcel for "This Sheet".
2. Navigate to the "Spreedsheet" tab where you'll find a new field for entering a Google Sheet URL.
3. Enter the URL of your Google Spreadsheet and click the update button.

## Customization

For advanced customization, such as modifying the appearance of the spreadsheet within Foundry VTT, you can edit the `sheexcel.css` file located in the module's directory.

## Support & Contributions

If you encounter any issues or have suggestions for improvements, please create an issue on the [GitHub repository](https://github.com/muhahahahe/foundry-sheexcel-module/issues). Contributions to the project are welcome!

## License

This module is licensed under the MIT License. See the `LICENSE` file for more details.