# Bottleneck - Work Log Tool

Bottleneck is a simple, lightweight work log tool built with Electron. It runs in the background and lets you quickly log what you're working on using a global keyboard shortcut.

![App Screenshot](https://via.placeholder.com/800x600.png?text=Bottleneck+App+Screenshot)
*(Screenshot placeholder)*

## Features

*   **Global Shortcut:** Quickly open the logging window from anywhere on your system.
*   **Simple Interface:** A clean and straightforward interface for logging and viewing your work.
*   **Time Tracking:** Automatically calculates the time spent on each task.
*   **Local Storage:** All logs are stored locally on your machine.
*   **Cross-Platform:** Works on macOS, Windows, and Linux.

## How to Use

1.  Launch the application.
2.  Press `CommandOrControl+Shift+L` to open the logging popup.
3.  Type what you are working on and press `Enter`.
4.  The main window will display your work log for the day.

## Getting Started (for Developers)

To run this application locally:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd bottleneck
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application:**
    ```bash
    npm start
    ```

## Log File Location

Your work logs are stored in your computer's `Documents` folder, inside a directory named `WorkLogger/Logs`. The logs are organized by date in JSON format.
