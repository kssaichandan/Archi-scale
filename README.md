# 📐 Archi-Scale

**Archi-Scale** is a comprehensive unit converter, scale calculator, and reference tool explicitly designed for architects, construction professionals, drafters, and designers.

## 🌟 Features

### 📏 Standard Converters
Easily convert between metric and imperial systems with high precision.
- **Length, Area, & Volume**: Convert m, cm, mm to inches, feet, yards, acres, and hectares.
- **Mass / Weight**: Accurately swap between kg, tonnes, pounds, and stones.
- **Scientific**: Temperature, Pressure, Density, and Angle (Degrees, Radians, Gradians).

### 🏗️ Advanced Scale Tools
Work with physical drawings or CAD software effortlessly.
- **Metric Scale Converter**: Standard presets (1:50, 1:100, 1:200) for real-world to drawing size translations.
- **Imperial Scale Converter**: Architect's scales (e.g., 1/4" = 1'-0", 1/8" = 1'-0").
- **Custom Scale Converter**: Input any arbitrary ratio (e.g., 1:33.3) for non-standard scales.
- **Find Scale (Reverse Scale Finder)**: Measure a line on a drawing and enter the known real-world dimension to instantly determine the drawing's scale.
- **Paper Fit Checker**: Enter real-world dimensions and a scale to see exactly which ISO or ANSI paper sizes can accommodate your drawing.
- **Scale-to-Scale Resize**: Quickly calculate enlargement/reduction percentages for printers or CAD.

### 🧱 Construction Tools
- **Board Feet Calculator**: For lumber and woodworking.
- **Roofing Squares**: Standard roofing calculations.
- **Concrete Volume**: Compute required cubic yards/meters.

### 📖 Built-in Reference Library
- **Architectural Dimensions**: Standard sizes for doors, windows, stairs, furniture, and more.
- **Material Densities**: Quick lookups for common building materials.
- **Paper Sizes**: Complete ISO and ANSI reference tables.
- **Scale References**: Guidance on when to use specific scales (e.g., detail vs. site plan).

## 💻 Technical Details

Archi-Scale is a **Static Web Application** built using:
- **Vanilla HTML5, CSS3, & JavaScript (ES6)**
- Zero external dependencies (no frameworks, no bundlers needed)
- **Responsive Design**: A mobile-first, app-like layout that works seamlessly across phones, iPads, and desktop laptops. The navigation sidebar is hidden by default and accessible via a universally visible hamburger menu to maximize workspace.
- **Theming**: Includes full Light Mode and Dark Mode support with a vibrant custom orange (`#ff8200`) accent color.

## 🚀 Deployment

The project is configured for one-click deployment to [Render](https://render.com) using the included `render.yaml` file.

1. Connect your repository to Render.
2. Render will automatically detect the `render.yaml` Blueprint.
3. The application will be deployed instantly as a blazing-fast Static Site.
