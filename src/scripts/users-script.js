const axios = require('axios');

// Base URL
const BASE_URL = 'http://localhost:3001/user/registration/combined/';

// Function to generate a random string
function generateRandomString(length) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Function to create a user
async function createUser(i) {
  // Generate random username, password, and email
  const username = `user${generateRandomString(6)}`;
  const password = generateRandomString(12);
  const email = `${username}@example.com`;

  // Create JSON payload
  const jsonPayload = {
    data: {
      userInfo: {
        active: true,
        applicationId: 'myminioadmin',
        membership: [],
        userData: {
          username: username,
          password: password,
        },
        email: email,
      },
      registrationInfo: {
        generateAuthenticationToken: true,
        applicationId: 'myminioadmin',
      },
    },
  };

  try {
    // Send HTTP POST request
    await axios.post(BASE_URL, jsonPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-stencil-tenantid': 'minio-tenant',
        authorization: 'master',
      },
    });
    console.log(`Created user ${i}: ${username} with email ${email}`);
  } catch (error) {
    console.error(
      `Error creating user ${i}:`,
      error.response ? error.response.data : error.message,
    );
  }
}

// Get the number of users to create from command-line arguments
const numUsers = parseInt(process.argv[2]) || 100; // Default to 100 if no argument is passed

// Loop to create users
(async () => {
  for (let i = 1; i <= numUsers; i++) {
    await createUser(i);
  }
})();