const { google } = require('googleapis');
require('dotenv').config();

const fetchGoogleSpreadsheet = async () => {

    try {
        // Replace with your Google Sheet ID
        const spreadsheetId = '15a3pWTYd-8Vj0UlpYdNRdcJNggilSe56ySP2Re46peE';

        // Replace with your desired sheet name and range
        const range = 'Players!A1:B10';


        // Load the service account key JSON file
        const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

        console.log(serviceAccount);

        // Configure a JWT auth client
        const auth = new google.auth.JWT(
            serviceAccount.client_email,
            null,
            serviceAccount.private_key,
            ['https://www.googleapis.com/auth/spreadsheets.readonly']
        );

        // Google Sheets API
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        return response;

    } catch (err) {
        console.error('Error fetching data from Google Sheets:', err);
    }
};

module.exports = { fetchGoogleSpreadsheet }; 
