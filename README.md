# 🎭 Meme Storage App

A simple React web application for storing and searching memes by keywords. Upload your favorite memes with searchable tags and easily find them later!

## Features

- **Upload Memes**: Add memes by providing an image URL and keywords
- **Search Functionality**: Search through your memes using keywords
- **Local Storage**: All memes are stored in your browser's local storage
- **Responsive Design**: Works great on desktop and mobile devices
- **Modern UI**: Clean, modern interface with smooth animations

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd meme-app
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open your browser and go to `http://localhost:3000`

## How to Use

### Uploading Memes

1. In the "Upload New Meme" section, fill out the form:
   - **Title** (optional): Give your meme a title
   - **Image URL**: Paste the URL of your meme image
   - **Keywords**: Add comma-separated keywords (e.g., "funny, cat, reaction")

2. Click "🚀 Add Meme" to save your meme

### Searching Memes

1. Use the search bar in the "Search Memes" section
2. Type any keyword to filter your memes
3. The search is case-insensitive and matches partial keywords
4. Click the "✕" button to clear the search

### Managing Memes

- View all your memes in the grid layout
- Each meme shows its title, image, and keywords
- Click "🗑️ Delete" to remove a meme (with confirmation)
- Hover over memes for interactive effects

## Technical Details

- **Frontend**: React 18 with functional components and hooks
- **Storage**: Browser localStorage for persistence
- **Styling**: Modern CSS with responsive design
- **Search**: Real-time filtering with case-insensitive matching

## File Structure

```
meme-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── MemeUpload.js
│   │   ├── MemeUpload.css
│   │   ├── MemeSearch.js
│   │   ├── MemeSearch.css
│   │   ├── MemeDisplay.js
│   │   └── MemeDisplay.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

Feel free to submit issues, feature requests, or pull requests!

## License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy meme collecting! 🎉** 