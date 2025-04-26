const express = require('express');
const app = express();
require('dotenv').config();
console.log("Loaded MONGO_URI:", process.env.MONGO_URI); // Debugging
const { MongoClient, ServerApiVersion } = require('mongodb');
const axios = require('axios');
const VERIFY_TOKEN = "my_nourish"; // Same token used in Meta Webhook setup
const token = process.env.token;
const phoneNumberId = '531391063399476'; // Your phone number ID from Meta
const url = `https://graph.facebook.com/v16.0/${phoneNumberId}/messages`;
app.use(express.json());

// Verify Webhook (for the first time setup)
app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log("Webhook Verified Successfully!");
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Verification failed!');
    }
});

app.post('/webhook', async (req, res) => {
    console.log("Received Webhook Event:", JSON.stringify(req.body, null, 2));

    if (req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const number = req.body.entry[0].changes[0].value.messages[0].from;
        const reqq = await axios.post('https://nourish-backend-t4s3.onrender.com/get-requests', {
          number: number
        });
        console.log("#########################################");
        console.log(reqq.data.requests);
        console.log("#########################################");
        let history="These are the past seraches of the user (seperated by comma), keep it in mind --> ";
        let nn=reqq.data.requests.length;
        for(let i=0;i<nn;i++)
        {
          history=history+reqq.data.requests[i]+", ";
        }
        const message = `You are a nutritionist specialised at helping people to control their blood sugar level spike. So answer all the queries in the same manner. This is the user detail -->name = ${reqq.data.requests.fullName},  email = ${reqq.data.requests.email},  number = ${reqq.data.requests.number},  password = ${reqq.data.requests.password},city = ${reqq.data.requests.city}, state= ${reqq.data.requests.state},  gender = ${reqq.data.requests.gender},  age = ${reqq.data.requests.age},  height = ${reqq.data.requests.height},  weight = ${reqq.data.requests.weight},  bmi = ${reqq.data.requests.bmi},  diabetes = ${reqq.data.requests.diabetes},  foodAllergies = ${reqq.data.requests.foodAllergies},  bloodPressure = ${reqq.data.requests.bloodPressure},  cholesterolLevels = ${reqq.data.requests.cholesterolLevels},  smokingHabit = ${reqq.data.requests.smokingHabit},  alcoholConsumption = ${reqq.data.requests.alcoholConsumption},  physicalActivity = ${reqq.data.requests.physicalActivity},  currentMedications = ${reqq.data.requests.currentMedications},  medicalHistory = ${reqq.data.requests.medicalHistory}, doctorsNotes = ${reqq.data.requests.doctorsNotes},  emergencyContact = ${reqq.data.requests.emergencyContact}.There is a chance that user has updated their personal info in past queries so consider that too while answering. Do keep in mind the location of the user and recommend food according to location if asked. ${history} ,And Right now answer this query -->${req.body.entry[0].changes[0].value.messages[0].text.body}`;
        const message_f=req.body.entry[0].changes[0].value.messages[0].text.body;

      console.log(message);
      console.log("*****");



        try {
            // Send the message to the /chat API to get food recommendations
            const chatResponse = await axios.post("https://nourish-backend-t4s3.onrender.com/chat", { message });

            const recommendedFoods = chatResponse.data; // Get response from model
            
            // Prepare WhatsApp reply
            const data = {
                messaging_product: "whatsapp",
                to: `+${number}`,
                text: { body: recommendedFoods } // Send model's response back
            };

            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            };

            await axios.post(url, data, { headers });

            try {
                const response = await axios.post('https://nourish-backend-t4s3.onrender.com/save-request', {
                  number, // Sending username as part of the request body
                  message_f,
                });
              } catch (error) {
                const errorMessage = { sender: 'bot', text: 'Sorry, there was an error saving the prompt.' };
                setMessages((prevMessages) => [...prevMessages, errorMessage]);
              } 


            console.log("Message sent successfully:", recommendedFoods);
        } catch (error) {
            console.error("Error processing request:", error);
        }
    } else {
        console.log("Invalid webhook data structure.");
    }

    res.sendStatus(200);
});

const PORT=process.env.PORT || 8000;
app.listen(PORT, () => console.log("🚀 Webhook server running on port 8000"));

const User = require('./models/User');
const mongoose = require('mongoose');
app.use(express.json());
  const cors = require("cors");
  const Together = require("together-ai");
  
  const API_KEY = 'bb8315f0403a1dc870b93a1cb678a2d9a12fcda4e7b82d02442207314b48a9bc';
  
  const together = new Together({ apiKey: API_KEY }); // Initialize Together API client
  
  app.use(cors());
  app.use(express.json());


mongoose.connect(process.env.MONGO_URI, {
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        console.log("AAAAAAAA gayaaaa");
        console.log("Processing user input.."+req.body);

        // Make a request using the Together SDK
        const response = await together.chat.completions.create({
            messages: [{ role: "user", content: message }],
            model: "meta-llama/Llama-3.3-70B-Instruct-Turbo"
        });

        // Extract food recommendations
        const alternatives = response.choices[0].message.content
            .split("\n")
            .filter(line => line.trim() !== "")
            .map(line => line.replace(/\*/g, "").trim());

        // Send the top 5 food alternatives
        const result = alternatives.slice(1, 7).join("\n");
        console.log("Recommended foods:", result);
        res.send(result);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Something went wrong" });
    }
});
app.post('/save-request', async (req, res) => {
    const { number, message_f } = req.body;
  
    try {
      const user = await User.findOne({ number });
  
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
  
      // Add request to user history
      user.requests.push(message_f);
      await user.save();
  
      res.status(200).json({ message: 'Request saved successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  app.post('/register', async (req, res) => {
    try {
        const {
            fullName,
            email,
            number,
            password,
            city,
            state,
            gender,
            age,
            height,
            weight,
            bmi,
            diabetes,
            foodAllergies,
            bloodPressure,
            cholesterolLevels,
            smokingHabit,
            alcoholConsumption,
            physicalActivity,
            currentMedications,
            medicalHistory,
            doctorsNotes,
            emergencyContact
        } = req.body;

        console.log("Received registration data:", req.body);

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user
        const newUser = new User({
            fullName,
            email,
            number,
            password,
            city,
            state,
            gender,
            age,
            height,
            weight,
            bmi,
            diabetes,
            foodAllergies,
            bloodPressure,
            cholesterolLevels,
            smokingHabit,
            alcoholConsumption,
            physicalActivity,
            currentMedications,
            medicalHistory,
            doctorsNotes,
            emergencyContact,
            requests: []
        });

        console.log("New user object created:", newUser);

        // Save user to database
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });

    } catch (err) {
        console.error("Error in registration:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

  app.post('/get-requests', async (req, res) => {
    const { number } = req.body;
  
    // Validate input data
    if (!number) {
      return res.status(400).json({ error: 'Username is required.' });
    }
  
    try {
      // Find user by username
      const user = await User.findOne({ number });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      // Return the user's request array
      res.status(200).json({ requests: user });
    } catch (error) {
      console.error('Error retrieving requests:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
