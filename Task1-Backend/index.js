
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const port = 5000; // You can change the port if needed

const API_BASE_URL = 'http://20.244.56.144/train/';
const YOUR_ACCESS_TOKEN = 'rdxwKw'   ; // Replace with your actual access token
//registering company

const registrationUrl = 'http://20.244.56.144/train/register';
const registrationData = {
    companyName: 'SK',
    ownerName:"ShivaKrishna",
    rollNumber: '160120748054',
    ownerEmail:"shivakrishnapeechara@gmail.com",
    accessCode: 'rdxwKw'
};

import('node-fetch').then(async ({ default: fetch }) => {
    try {
        const response = await fetch(registrationUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Registration Response:', data);
    } catch (error) {
        console.error('Error during registration:', error);
    }
}).catch(error => {
    console.error('Error while importing node-fetch:', error);
});

// authroization

// const authUrl = 'http://20.244.56.144/train/auth';
// const authData = {
//     companyName: 'SK',
//     ownerName:"ShivaKrishna",
//     rollNumber: '160120748054',
//     ownerEmail:"shivakrishnapeechara@gmail.com",
//     accessCode: 'rdxwKw'
// };

// fetch(registrationUrl, {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(registrationData)
// })
// .then(response => response.json())
// .then(data => {
//     console.log('Registration Response:', data);
// })
// .catch(error => {
//     console.error('Error during registration:', error);
// });

let trainsData = []; // To store the train data

// Function to fetch and update the train data
const fetchTrainsData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/trains`, {
      headers: {
        Authorization: `Bearer ${YOUR_ACCESS_TOKEN}`,
      },
    });
    trainsData = response.data;
  } catch (error) {
    console.error('Error fetching train data:', error.message);
  }
};

// Function to filter trains departing in the next 12 hours and fulfill the other conditions
const filterTrains = () => {
  const now = new Date();
  const next12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const filteredTrains = trainsData.filter((train) => {
    const departureTime = new Date(train.departureTime);
    const delayMinutes = train.delay ? train.delay : 0;
    const adjustedDepartureTime = new Date(departureTime.getTime() + delayMinutes * 60 * 1000);
    return (
      adjustedDepartureTime > now &&
      adjustedDepartureTime <= next12Hours &&
      train.coaches.sleeper.seatsAvailability > 0 &&
      train.coaches.AC.seatsAvailability > 0
    );
  });

  // Sort the filtered trains based on the given criteria
  filteredTrains.sort((a, b) => {
    // Sort based on the ascending order of price
    if (a.coaches.sleeper.price === b.coaches.sleeper.price) {
      // Sort based on the descending order of tickets
      if (b.coaches.sleeper.seatsAvailability === a.coaches.sleeper.seatsAvailability) {
        // Sort based on the descending order of adjusted departure time
        return new Date(b.departureTime) - new Date(a.departureTime);
      }
      return b.coaches.sleeper.seatsAvailability - a.coaches.sleeper.seatsAvailability;
    }
    return a.coaches.sleeper.price - b.coaches.sleeper.price;
  });

  return filteredTrains;
};

// Endpoint to get the real-time train schedule
app.get('/trains', (req, res) => {
  const filteredTrains = filterTrains();
  res.json(filteredTrains);
});

// Schedule to fetch train data every hour
// cron.schedule('0 * * * *', () => {
//   fetchTrainsData();
// });

// Fetch initial data and start the server
(async () => {
  await fetchTrainsData();
  console.log(trainsData);
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
 });
})();
