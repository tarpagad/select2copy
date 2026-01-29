# xselect2copy

A browser extension that enables copying selected text while holding ctrl, shift, or alt keys.

## Description

xSelect2Copy is a lightweight browser extension designed to streamline text copying on web pages. Instead of the traditional right-click and "Copy" process, this extension allows you to copy text selections simply by holding down a modifier key (Ctrl, Shift, or Alt) while highlighting the text with your mouse.

### Key Features
- **Instant Copying:** Hold Ctrl, Shift, or Alt while selecting text to copy it directly to your clipboard
- **Cross-Platform:** Works on Windows, macOS, and Linux
- **No Interference:** Doesn't modify page content or interfere with website functionality
- **Customizable:** Configure which modifier keys trigger the copy action in the extension options
- **Privacy-Focused:** No data collection or tracking; operates entirely locally

### How It Works
1. Install the extension
2. Select text on any webpage while holding Ctrl (or your configured key)
3. The selected text is automatically copied to your clipboard
4. Paste anywhere as usual

### Use Cases
- Quick copying of quotes, code snippets, or important information
- Efficient research and note-taking
- Streamlined workflow for content creators and developers
- Accessibility improvement for users who prefer keyboard shortcuts

### Privacy Policy
This extension does not collect, store, or transmit any personal data. It operates entirely within your browser and only accesses the clipboard when you explicitly copy text using the extension's functionality.

### Permissions
- Storage: To save your key preferences
- Active Tab: To detect text selections on web pages

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd select2copy
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or if using Bun:
   ```
   bun install
   ```

3. Prepare the extension:
   ```
   npm run postinstall
   ```

## Development

Run the development server:
```
npm run dev
```
For Firefox:
```
npm run dev:firefox
```

## Build

Build for Chrome:
```
npm run build
```

Build for Firefox:
```
npm run build:firefox
```

Create a zip package:
```
npm run zip
```
For Firefox:
```
npm run zip:firefox
```

## Usage

1. Load the extension in your browser (Chrome/Firefox).
2. Navigate to any webpage.
3. Select text while holding Ctrl, Shift, or Alt to copy the selection.

## Technologies

- Built with [WXT](https://wxt.dev/) (Web Extension Toolkit)
- TypeScript
- Modern web extension APIs

## License

This project is licensed under the MIT License.
