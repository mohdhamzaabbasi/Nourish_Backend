const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    unique: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  bmi: {
    type: Number,
    required: true,
  },
  diabetes: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  foodAllergies: {
    type: String,
    default: 'None',
  },
  bloodPressure: {
    type: String,
    required: true,
  },
  cholesterolLevels: {
    type: String,
    required: true,
  },
  smokingHabit: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  alcoholConsumption: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  physicalActivity: {
    type: String,
    required: true,
  },
  currentMedications: {
    type: String,
    default: 'None',
  },
  medicalHistory: {
    type: String,
    default: 'None',
  },
  doctorsNotes: {
    type: String,
    default: 'None',
  },
  emergencyContact: {
    type: String,
    required: true,
  },
  requests: [
    {
      type: String,
    },
  ],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
