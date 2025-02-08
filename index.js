const express = require('express');
const app = express();
const VERIFY_TOKEN = "my_nourish"; // Same token used in Meta Webhook setup
const token = 'EAAIcsyXdrwsBOz6lyObRoStD2tSyYn1iIRRxhqkhWkt0T4OF9cZBQGMAkvFn67qAV6cnklnsmt01UAPvsW9HhSwY4Vu3CPKPAYqQ4scFGLFFxWZBmMZC5k8VME9J9GVpDet1lGcXP2xLEhlPYOUTd6FZAHDiKCZC9QLmHSRUyzj5gDB2pJgoFObmIB7lZChACfdZCnM1nY8Mz7dPyqgmwKZCobizWEsZD'; // Your WhatsApp Business API access token
const phoneNumberId = '531391063399476'; // Your phone number ID from Meta
const url = `https://graph.facebook.com/v16.0/${phoneNumberId}/messages`;
const User = require('./models/User');
const mongoose = require('mongoose');
app.use(express.json());
  const cors = require("cors");
  const Together = require("together-ai");
  
  const PORT = 5000;
  const API_KEY = 'bb8315f0403a1dc870b93a1cb678a2d9a12fcda4e7b82d02442207314b48a9bc';
  
  const together = new Together({ apiKey: API_KEY }); // Initialize Together API client
  
  app.use(cors());
  app.use(express.json());

  const axios = require('axios');
  app.listen(5000, () => console.log("🚀 Webhook server running on port 5000"));


mongoose.connect('mongodb://127.0.0.1:27017/nourish', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
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
    const { username, number, email, password} = req.body;
  console.log(req.body);
    try {
      // Check if user already exists
      console.log("Yahan tak aaya1");
      const existingUser = await User.findOne({ username });

      console.log("Yahan tak aaya");

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      console.log("Yahan tak aaya");
      // Create new user
      const newUser = new User({
        username,
        number,
        email,
        password,
        requests: [],
      });
      console.log("dsc");
      console.log(newUser);
      // Save user to database
      await newUser.save();
      res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
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
      res.status(200).json({ requests: user.requests });
    } catch (error) {
      console.error('Error retrieving requests:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });