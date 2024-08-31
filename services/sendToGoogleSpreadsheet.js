const { google } = require('googleapis');
require('dotenv').config();

const sendToGoogleSpreadsheet = async (gameNo, players) => {

    try {
        // Replace with your Google Sheet ID
        const spreadsheetId = '15a3pWTYd-8Vj0UlpYdNRdcJNggilSe56ySP2Re46peE';

        // Replace with your desired sheet name and range
        const range = `Game${gameNo}!A1`;


        // Load the service account key JSON file
        const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

        const auth = new google.auth.JWT(
            serviceAccount.client_email,
            null,
            serviceAccount.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        // Configure a JWT auth client
        const sheets = google.sheets({ version: 'v4', auth });

        // Format players data for Google Sheets
        const values = players.map(player => [player.name, player.points]);

        const resource = {
            values,
        };

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',  // Treats input as user-entered data
            resource,
        });

        return response;

    } catch (err) {
        console.error('Error in sending data to Google Sheets:', err);
    }
};

module.exports = { sendToGoogleSpreadsheet }; 
