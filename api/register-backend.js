// This file exists only to force Vercel to bundle these dependencies 
// which are used in the backend folder but might be missed by the analyzer.
import 'express';
import 'cors';
import 'dotenv';
import '@supabase/supabase-js';
import 'jsonwebtoken';
import 'uuid';

console.log('Backend dependencies registered for Vercel bundling.');
