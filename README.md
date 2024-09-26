# Steal Share Game Server

This repository hosts a **Node.js**-based HTTP server built using **Express.js**, hosted on **AWS EC2**, and backed by **Amazon RDS** for database management. It was created for hosting a game during the First Year Introductory event of the EDC Club at PICT. The game is based on the game theory problem, the **Prisoner's Dilemma**, where players choose to "Steal" or "Share" in a series of rounds. The server supports multiple game rooms, real-time interactions via WebSockets, incorporates various admin features for managing players, and has a CI/CD pipeline for seamless deployment.

## Features

### 1. Admin Controls
- **Room Creation**: Admins can create multiple game rooms.
- **Pairing Players in a Room**: Admins pair the players in each room, as the game requires 2 participants.
- **Resetting Round Clock**: Admins can reset the game clock for any room, starting a new round.
- **Filtering Players**: After each game, admins can filter and manage players in the database.

### 2. Player Management
- **Player Input**: Player names are sequentially entered into an Excel file as they arrive at the event.
- **Google API Integration**: Admins can fetch player names from the Excel file using Google's APIs and inject them into the database hosted on Amazon RDS. The state of the game can also be exported back to a new spreadsheet after each round.
- **Room Management**: The state of player is stored in memory as an object storing their socket connection, their player id and their room id.

### 3. WebSocket-based Game
- **Real-time Game Play**: Players are paired in real-time for a round of the Prisoner's Dilemma. Each player selects "Steal" or "Share," and results are calculated based on their opponent's choice.
- **Multiple Game Rooms**: Players are divided into independent game rooms, allowing for simultaneous rounds.
- **Message Broadcasting**: Admins can broadcast messages:
  - To a specific player
  - To all players in a room
  - To all players across all rooms

### 4. Rate Limiting with Redis
- **Redis Integration**: Redis is used for application-layer rate limiting to prevent abuse of WebSocket connections. The limits include:
  - **Number of WebSocket Requests**: Restricts the number of WebSocket connection attempts per client.
  - **Number of WebSocket Messages**: Caps the message frequency per client to avoid server overload.

### 5. Docker and CI/CD Pipeline
- **Dockerized Deployment**: The server uses Docker for a containerized deployment. Each push to the `main` branch triggers a CI/CD pipeline:
  - The latest image of the Node.js server is built and pushed to **Docker Hub**.
  - The **AWS EC2** machine pulls the latest image and starts two containers:
    - One for the Node.js server
    - One for Redis
  - Both containers communicate over a Docker network, ensuring smooth operations.
- **CI/CD Pipeline**: Automates the deployment process, from code push to the production environment, ensuring an updated server image is always deployed.

### 6. Google reCAPTCHA for Bot Protection
- **Bot Prevention**: Google reCAPTCHA is used to prevent bot abuse on the website. Critical forms and actions require human verification to proceed, ensuring a secure user experience.

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: Amazon RDS (PostgreSQL)
- **Hosting**: AWS EC2 for server deployment
- **Redis**: Used for rate limiting and caching
- **WebSockets**: For real-time player communication
- **Docker**: Containerized deployment environment for the Node.js server and Redis
- **CI/CD**: Automated deployment pipeline using Docker Hub
- **Google reCAPTCHA**: Prevents bot interactions on the website
