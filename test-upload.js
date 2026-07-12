import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpload() {
  // First login as the seller (the user might be logged in, we need a session)
  // But wait, we can't easily login without a password.
  // Instead, let's just use the service role key to test if the bucket exists.
  const adminClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
  
  // create a dummy file
  const buffer = Buffer.from('test image data');
  const path = `test-user/test-${Date.now()}.txt`;
  
  const { data, error } = await adminClient.storage.from('listing-images').upload(path, buffer, {
    contentType: 'text/plain'
  });
  
  if (error) {
    console.error('Admin upload error:', error);
  } else {
    console.log('Admin upload success:', data);
  }
}

testUpload();
