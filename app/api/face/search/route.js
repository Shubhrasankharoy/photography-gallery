import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const eventId = formData.get('eventId');
    const minimumConfidence = formData.get('minimumConfidence') || '0.35';

    if (!image || !eventId) {
      return NextResponse.json({ error: 'Missing image or eventId' }, { status: 400 });
    }

    // Call Python worker API endpoint /search
    const pythonUrl = process.env.PYTHON_WORKER_URL || 'http://localhost:5000';
    
    const pyFormData = new FormData();
    pyFormData.append('image', image);
    pyFormData.append('eventId', eventId);
    pyFormData.append('minimumConfidence', minimumConfidence);

    const response = await fetch(`${pythonUrl}/search`, {
      method: 'POST',
      body: pyFormData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Python service error: ${errText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Face search API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
