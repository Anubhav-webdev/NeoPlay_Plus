import express from 'express';
import connectDB from "./db/Connect.js";
import dotenv from "dotenv"
dotenv.config({
  path: './.env',
})
connectDB()