import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const saltRounds = 10;

function register(req, res) {
  try {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hash(password, 10);
  } catch (err) {}
}
