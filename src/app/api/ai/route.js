import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { query } = await request.json();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({
        response: 'AI Assistant is not configured. Please add your GEMINI_API_KEY to .env.local.\n\nYou can get a free API key from: https://aistudio.google.com/apikey'
      });
    }

    // Get database context
    const supabase = await createClient();
    const { data: properties } = await supabase.from('properties').select('title, display_id, property_type, area_name, city, facing, total_area, area_unit, asking_price, price_per_sqft, status, length, width').eq('is_deleted', false).limit(100);
    const { data: contacts } = await supabase.from('contacts').select('name, role, phone, company, area').eq('is_deleted', false).limit(50);
    const { data: areas } = await supabase.from('areas').select('name, city, current_avg_rate').eq('is_deleted', false).limit(50);
    const { data: developments } = await supabase.from('developments').select('name, project_type, current_status, expected_impact, location').eq('is_deleted', false).limit(50);

    const dbContext = `
DATABASE CONTENTS:
Properties (${properties?.length || 0}): ${JSON.stringify(properties?.slice(0, 50) || [])}
Contacts (${contacts?.length || 0}): ${JSON.stringify(contacts?.slice(0, 30) || [])}
Areas (${areas?.length || 0}): ${JSON.stringify(areas || [])}
Developments (${developments?.length || 0}): ${JSON.stringify(developments || [])}`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a real estate database assistant. Answer questions ONLY based on the database contents provided below. Never invent or guess information. If data is not available, clearly say "No information is available in your database."

Format prices in Indian Rupees (₹) with lakh/crore notation.

${dbContext}

USER QUESTION: ${query}

Provide a clear, concise answer based on the database. List matching results with key details.`
            }]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
        })
      }
    );

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate a response. Please try again.';

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({ response: 'Something went wrong with the AI assistant. Please try again.' }, { status: 500 });
  }
}
