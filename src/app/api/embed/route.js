import { NextResponse } from 'next/server';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Parse the incoming request document
    const document = await request.json();

    // Log the received data
    console.log('📥 Received embed request');
    console.log('document:', document.metadata)
    console.log('📄 PDF ID:', document.pdfId);
    console.log('📂 File Path:', document.filePath);
    console.log('📚 Number of pages:', document.docs?.length || 0);

    // Log first page content (truncated for readability)
    if (document.docs && document.docs.length > 0) {
      const firstPage = document.docs[0];
      console.log('📖 First page preview:', firstPage.pageContent?.substring(0, 200) + '...');
      console.log('📊 Metadata:', firstPage.metadata);
    }

    // Split the document
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await splitter.createDocuments(
      document.docs.map((d) => d.pageContent),
      document.docs.map((d) => d.metadata)
    );

    console.log("✅ Split completed - total chunks: ", splitDocs.length);

    // Initialize Hugging Face embeddings
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: "sentence-transformers/all-mpnet-base-v2",
      provider: "hf-inference",
    });

    // Generate embeddings 
    const texts = splitDocs.map((d) => d.pageContent);
    const embeddingsArray = await embeddings.embedDocuments(texts);

    console.log('🧮 Generated embeddings:', embeddingsArray.length);

    //Insert into Supabase
    const { data, error } = await supabase
      .from('pdf_embeddings')
      .insert(
        embeddingsArray.map((embedding, i) => ({
          user_id: document.userId,
          pdf_id: document.pdfId,
          chunk_text: texts[i],
          embedding,
          metadata: splitDocs[i].metadata || {},
        }))
      );

    if (error) throw error;

    console.log('✅ Stored embeddings in Supabase:', data?.length || 0);
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Embed request received successfully',
      received: {
        pdfId: document.pdfId,
        filePath: document.filePath,
        pageCount: document.docs?.length || 0
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error in /api/embed:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process embed request'
    }, { status: 500 });
  }
}

// Optional: Handle other HTTP methods
export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed. Use POST.'
  }, { status: 405 });
}